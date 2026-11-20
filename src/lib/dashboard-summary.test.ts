import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { readDashboardSummary } from "./dashboard-summary";

const migrations = [
  "20260313044340_init",
  "20260321072147_add_previous_severity",
  "20260324084756_add_alert_metadata",
  "20260713090000_add_signal_and_provider_health",
];

test("the summary stays unverified after a newer observation until that poll succeeds", async (t) => {
  const db = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: "file::memory:" }),
  });
  t.after(() => db.$disconnect());
  for (const name of migrations) {
    const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
    for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
      await db.$executeRawUnsafe(statement);
    }
  }

  const at = (time: string) => new Date(`2026-11-20T${time}Z`);
  const provider = "cloudflare";
  const previous = { startedAt: at("10:00:00"), completedAt: at("10:00:10") };
  const next = { startedAt: at("10:02:00"), completedAt: at("10:02:06") };
  await db.providerState.create({
    data: { provider, lastAttemptAt: previous.startedAt, lastSuccessAt: previous.completedAt },
  });
  await db.pollLog.create({ data: { provider, ...previous } });
  const { id } = await db.alert.create({
    data: {
      source: provider,
      externalId: "in-flight-incident",
      title: "Service disruption",
      category: "cloud",
      status: "investigating",
      severity: "major",
      timestamp: previous.startedAt,
      lastObservedAt: at("10:00:07"),
    },
    select: { id: true },
  });

  const snapshotAt = (time: string) =>
    db.$transaction((tx) => readDashboardSummary(tx, at(time)));

  const before = await snapshotAt("10:02:03");
  assert.equal(before.incidents.total, 1);
  assert.equal(before.affected[0].id, id);

  const assertUnverified = async () => {
    const snapshot = await snapshotAt("10:02:05");
    const source = snapshot.providers.find(({ key }) => key === provider);
    assert.equal(source?.dataState, "unverified");
    assert.equal(source.coverage, "unavailable");
    assert.equal(source.status, "unknown");
    assert.equal(snapshot.coverage.fresh, 0);
    assert.equal(snapshot.affected.length, 0);
    assert.equal(snapshot.lastPollAt, previous.completedAt.toISOString());
  };

  await db.alert.update({ where: { id }, data: { lastObservedAt: at("10:02:04") } });
  await assertUnverified();

  await db.alert.update({ where: { id }, data: { status: "resolved" } });
  await assertUnverified();

  await db.alert.update({
    where: { id },
    data: { signalKind: "advisory", status: "active" },
  });
  await assertUnverified();

  await db.alert.update({
    where: { id },
    data: { signalKind: "incident", status: "investigating" },
  });
  await db.providerState.update({
    where: { provider },
    data: { lastAttemptAt: next.startedAt, lastSuccessAt: at("10:02:05") },
  });
  await assertUnverified();

  await db.pollLog.create({ data: { provider, ...next } });
  const recovered = await snapshotAt("10:02:07");
  assert.equal(recovered.coverage.fresh, 1);
  assert.equal(recovered.incidents.bySeverity.major, 1);
  assert.equal(recovered.affected[0].id, id);
  assert.equal(recovered.lastPollAt, next.completedAt.toISOString());
});
