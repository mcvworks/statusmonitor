import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";

const dir = mkdtempSync(join(tmpdir(), "dtmonitor-confirmation-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
process.env.AUTH_URL = "https://monitor.ducktyped.xyz";

// Dynamic imports ensure the database is created only in this test's temp dir.
const setup = (async () => {
  const { prisma } = await import("./db");
  const { GET } = await import("../app/api/subscriptions/confirm/route");
  const { hashToken } = await import("./email-subscriptions");
  await prisma.$executeRawUnsafe(`CREATE TABLE EmailSubscription (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, enabled BOOLEAN NOT NULL DEFAULT false,
    verifiedAt DATETIME, severityFilter TEXT NOT NULL DEFAULT '[]', sourceFilter TEXT NOT NULL DEFAULT '[]',
    pendingSeverityFilter TEXT, pendingSourceFilter TEXT, confirmationTokenHash TEXT UNIQUE,
    confirmationExpiresAt DATETIME, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
  )`);
  return { prisma, GET, hashToken };
})();

after(async () => {
  const { prisma } = await setup;
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

function request(token?: string) {
  const url = new URL("https://0.0.0.0:3002/api/subscriptions/confirm");
  if (token) url.searchParams.set("token", token);
  return new NextRequest(url, {
    headers: { host: "0.0.0.0:3002", "x-forwarded-host": "untrusted.example", "x-forwarded-proto": "http" },
  });
}

function checkRedirect(response: Response, status: "confirmed" | "invalid") {
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), `https://monitor.ducktyped.xyz/subscribe/confirmed?status=${status}`);
}

test("missing and invalid tokens redirect to the public site behind a proxy", async () => {
  const { GET } = await setup;
  checkRedirect(await GET(request()), "invalid");
  checkRedirect(await GET(request("not-a-real-token")), "invalid");
});

test("confirmation activates selected alerts, consumes the token, and redirects publicly", async () => {
  const { GET, prisma, hashToken } = await setup;
  const row = await prisma.emailSubscription.create({ data: {
    email: "confirmation-test@example.invalid",
    confirmationTokenHash: hashToken("local-valid-token"),
    confirmationExpiresAt: new Date(Date.now() + 60_000),
    pendingSeverityFilter: '["major"]', pendingSourceFilter: '["aws"]',
  } });
  checkRedirect(await GET(request("local-valid-token")), "confirmed");
  const saved = await prisma.emailSubscription.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(saved.enabled, true);
  assert(saved.verifiedAt);
  assert.equal(saved.severityFilter, '["major"]');
  assert.equal(saved.sourceFilter, '["aws"]');
  assert.equal(saved.confirmationTokenHash, null);
  assert.equal(saved.pendingSourceFilter, null);
  checkRedirect(await GET(request("local-valid-token")), "invalid");
});

test("expired tokens remain disabled and redirect publicly", async () => {
  const { GET, prisma, hashToken } = await setup;
  const row = await prisma.emailSubscription.create({ data: {
    email: "expired-test@example.invalid",
    confirmationTokenHash: hashToken("local-expired-token"),
    confirmationExpiresAt: new Date(Date.now() - 60_000),
    pendingSeverityFilter: '["major"]', pendingSourceFilter: '[]',
  } });
  checkRedirect(await GET(request("local-expired-token")), "invalid");
  const saved = await prisma.emailSubscription.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(saved.enabled, false);
  assert.equal(saved.verifiedAt, null);
});
