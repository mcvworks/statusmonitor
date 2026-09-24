import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";

const dir = mkdtempSync(join(tmpdir(), "dtmonitor-management-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
process.env.AUTH_URL = "https://monitor.ducktyped.xyz";
process.env.AUTH_SECRET = "management-test-only-secret";
process.env.RESEND_API_KEY = "re_test_fixture_only";

const sent: Array<{ to: string; subject: string; html: string }> = [];
const originalFetch = globalThis.fetch;
let failDelivery = false;
globalThis.fetch = async (input, init) => {
  assert.equal(String(input), "https://api.resend.com/emails", "Tests must not make external requests");
  if (failDelivery) return Response.json({ name: "application_error", message: "fixture failure" }, { status: 503 });
  sent.push(JSON.parse(String(init?.body)));
  return Response.json({ id: "fixture-message" });
};

const setup = (async () => {
  const { prisma } = await import("./db");
  const routes = await import("../app/api/subscriptions/manage/route");
  const { createManageToken } = await import("./email-subscriptions");
  const { sendSubscriberAlertEmail } = await import("./notifications/email");
  await prisma.$executeRawUnsafe(`CREATE TABLE EmailSubscription (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, enabled BOOLEAN NOT NULL DEFAULT false,
    verifiedAt DATETIME, severityFilter TEXT NOT NULL DEFAULT '[]', sourceFilter TEXT NOT NULL DEFAULT '[]',
    pendingSeverityFilter TEXT, pendingSourceFilter TEXT, confirmationTokenHash TEXT UNIQUE,
    confirmationExpiresAt DATETIME, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`);
  return { prisma, ...routes, createManageToken, sendSubscriberAlertEmail };
})();

after(async () => {
  globalThis.fetch = originalFetch;
  const { prisma } = await setup;
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

function request(method: string, body?: unknown, query = "", ip = "test-client") {
  return new NextRequest(`https://0.0.0.0:3002/api/subscriptions/manage${query}`, {
    method,
    headers: { "content-type": "application/json", "cf-connecting-ip": ip, "x-forwarded-host": "untrusted.example" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("management recovery sends a private canonical link without changing or exposing the subscription", async () => {
  const { prisma, POST, GET, createManageToken } = await setup;
  const row = await prisma.emailSubscription.create({ data: { email: "recover@example.invalid", enabled: true, verifiedAt: new Date(), severityFilter: '["major"]', sourceFilter: '["aws"]' } });
  const response = await POST(request("POST", { email: "RECOVER@example.invalid" }, "", "recover"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true });
  const message = sent.at(-1)!;
  assert.equal(message.to, row.email);
  const query = `?${new URLSearchParams({ id: row.id, token: createManageToken(row.id) })}`;
  assert(message.html.includes(`https://monitor.ducktyped.xyz/subscribe/manage${query.replaceAll("&", "&amp;")}`));
  assert(message.html.includes("Unsubscribe from email alerts"));
  assert(!message.html.includes("0.0.0.0"));
  const view = await GET(request("GET", undefined, query));
  assert.equal(view.status, 200);
  assert.equal(view.headers.get("cache-control"), "no-store");
  assert.equal((await view.json()).confirmed, true);
  assert.deepEqual(await prisma.emailSubscription.findUniqueOrThrow({ where: { id: row.id } }), row, "Opening the emailed link must not mutate a subscription");
  const count = sent.length;
  const unknown = await POST(request("POST", { email: "missing@example.invalid" }, "", "missing"));
  assert.equal(unknown.status, response.status);
  assert.deepEqual(await unknown.json(), { ok: true });
  assert.equal(sent.length, count);
  assert.equal(await prisma.emailSubscription.count({ where: { email: "missing@example.invalid" } }), 0);
});

test("management recovery validates and rate limits requests", async () => {
  const { POST } = await setup;
  assert.equal((await POST(request("POST", { email: "not-email" }))).status, 400);
  const malformed = new NextRequest("https://monitor.ducktyped.xyz/api/subscriptions/manage", { method: "POST", body: "{" });
  assert.equal((await POST(malformed)).status, 400);
  for (let index = 0; index < 5; index++) {
    assert.equal((await POST(request("POST", { email: `limit-${index}@example.invalid` }, "", "same-ip"))).status, 200);
  }
  assert.equal((await POST(request("POST", { email: "limit-next@example.invalid" }, "", "same-ip"))).status, 429);
  for (let index = 0; index < 5; index++) {
    assert.equal((await POST(request("POST", { email: "same-address@example.invalid" }, "", `different-${index}`))).status, 200);
  }
  assert.equal((await POST(request("POST", { email: "SAME-ADDRESS@example.invalid" }, "", "different-next"))).status, 429);
});

test("a delivery failure is retryable and does not change subscription state", async () => {
  const { prisma, POST } = await setup;
  const row = await prisma.emailSubscription.create({ data: { email: "delivery-failure@example.invalid" } });
  failDelivery = true;
  try { assert.equal((await POST(request("POST", { email: row.email }, "", "delivery"))).status, 503); }
  finally { failDelivery = false; }
  assert.deepEqual(await prisma.emailSubscription.findUniqueOrThrow({ where: { id: row.id } }), row);
  assert.equal((await POST(request("POST", { email: row.email }, "", "delivery"))).status, 200);
});

test("signed credentials cannot manage another address and deleting a subscription is idempotent", async () => {
  const { prisma, GET, PUT, DELETE, createManageToken } = await setup;
  const first = await prisma.emailSubscription.create({ data: { email: "remove@example.invalid", enabled: true, verifiedAt: new Date() } });
  const other = await prisma.emailSubscription.create({ data: { email: "keep@example.invalid", enabled: true, verifiedAt: new Date() } });
  const invalid = `?${new URLSearchParams({ id: other.id, token: createManageToken(first.id) })}`;
  assert.equal((await GET(request("GET", undefined, invalid))).status, 401);
  assert.equal((await PUT(request("PUT", { severities: ["major"], sources: [] }, invalid))).status, 401);
  assert.equal((await DELETE(request("DELETE", undefined, invalid))).status, 401);
  const valid = `?${new URLSearchParams({ id: first.id, token: createManageToken(first.id) })}`;
  assert.equal((await PUT(request("PUT", { severities: ["major"], sources: ["aws"] }, valid))).status, 200);
  assert.equal((await prisma.emailSubscription.findUniqueOrThrow({ where: { id: first.id } })).sourceFilter, '["aws"]');
  assert.equal((await DELETE(request("DELETE", undefined, valid))).status, 200);
  assert.equal((await DELETE(request("DELETE", undefined, valid))).status, 200);
  assert.equal((await GET(request("GET", undefined, valid))).status, 404);
  assert.deepEqual(await prisma.emailSubscription.findUniqueOrThrow({ where: { id: other.id } }), other);
});

test("pending subscriptions can be removed but cannot bypass confirmation by saving preferences", async () => {
  const { prisma, PUT, DELETE, createManageToken } = await setup;
  const row = await prisma.emailSubscription.create({ data: { email: "pending@example.invalid" } });
  const query = `?${new URLSearchParams({ id: row.id, token: createManageToken(row.id) })}`;
  assert.equal((await PUT(request("PUT", { severities: ["major"], sources: [] }, query))).status, 409);
  assert.equal((await prisma.emailSubscription.findUniqueOrThrow({ where: { id: row.id } })).enabled, false);
  assert.equal((await DELETE(request("DELETE", undefined, query))).status, 200);
  assert.equal(await prisma.emailSubscription.count({ where: { id: row.id } }), 0);
});

test("subscriber alert email includes an explicit unsubscribe link to the signed management page", async () => {
  const { sendSubscriberAlertEmail } = await setup;
  const url = "https://monitor.ducktyped.xyz/subscribe/manage?id=fixture&token=fixture";
  await sendSubscriberAlertEmail("template@example.invalid", [], url);
  const html = sent.at(-1)!.html;
  assert(html.includes(`href="${url.replaceAll("&", "&amp;")}#unsubscribe"`));
  assert(html.includes("Unsubscribe from email alerts"));
  assert(html.includes("Manage alert preferences"));
});
