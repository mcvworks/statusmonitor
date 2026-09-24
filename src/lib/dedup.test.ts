import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import type { AlertInput } from "./providers/types";

const dir = mkdtempSync(join(tmpdir(), "dtmonitor-dedup-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;

const setup = (async () => {
  const { prisma } = await import("./db");
  const { deduplicateAlerts } = await import("./polling/dedup");
  await prisma.$executeRawUnsafe(`CREATE TABLE Alert (
    id TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source TEXT NOT NULL, externalId TEXT NOT NULL, status TEXT NOT NULL,
    severity TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
    url TEXT, region TEXT, metadata TEXT, resolvedAt DATETIME,
    signalKind TEXT NOT NULL DEFAULT 'advisory',
    confidence TEXT NOT NULL DEFAULT 'official',
    UNIQUE (source, externalId)
  )`);
  return { prisma, deduplicateAlerts };
})();

after(async () => {
  const { prisma } = await setup;
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

test("large provider responses preserve new, updated, and unchanged classifications", async () => {
  const { prisma, deduplicateAlerts } = await setup;
  const incoming: AlertInput[] = Array.from({ length: 1605 }, (_, index) => ({
    source: "nvd", externalId: `CVE-2026-${index}`, category: "security",
    title: `Vulnerability ${index}`, severity: "major", status: "active",
    signalKind: "advisory", confidence: "official",
    timestamp: new Date("2026-09-24T00:00:00Z"),
  }));
  for (const index of [0, 731, 1504, 1604]) {
    const alert = incoming[index];
    const severity = index === 731 ? "minor" : alert.severity;
    const status = index === 1504 ? "investigating" : alert.status;
    await prisma.$executeRaw`INSERT INTO Alert (source, externalId, status, severity, title)
      VALUES (${alert.source}, ${alert.externalId}, ${status}, ${severity}, ${alert.title})`;
  }
  // The same external ID from another provider must not hide a new NVD alert.
  await prisma.$executeRaw`INSERT INTO Alert (source, externalId, status, severity, title)
    VALUES ('other-provider', ${incoming[1500].externalId}, 'active', 'major', ${incoming[1500].title})`;

  const result = await deduplicateAlerts(incoming);
  assert.deepEqual(result.unchanged, [incoming[0], incoming[1604]]);
  assert.deepEqual(result.updated, [incoming[731], incoming[1504]]);
  assert.deepEqual(result.new, incoming.filter((_, index) => ![0, 731, 1504, 1604].includes(index)));
  // Deduplication is read-only; it must not insert the newly classified alerts.
  const count = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) AS count FROM Alert`;
  assert.equal(Number(count[0].count), 5);
});

test("an empty provider response has no new or changed alerts", async () => {
  const { deduplicateAlerts } = await setup;
  assert.deepEqual(await deduplicateAlerts([]), { new: [], updated: [], unchanged: [] });
});
