import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { readDashboardSummary } from "./dashboard-summary";
import { CloudflareRadarProvider } from "./providers/cloudflare-radar";

const migrations = [
  "20260313044340_init",
  "20260321072147_add_previous_severity",
  "20260324084756_add_alert_metadata",
  "20260713090000_add_signal_and_provider_health",
];

async function createSummaryDb(t: TestContext) {
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

  return db;
}

test("the summary stays unverified after a newer observation until that poll succeeds", async (t) => {
  const db = await createSummaryDb(t);
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


test("Radar omission leaves coverage incomplete until the adapter reports an explicit end", async (t) => {
  const db = await createSummaryDb(t);
  const radar = new CloudflareRadarProvider();
  const earlier = new Date("2026-11-19T10:00:00Z");
  const pollStart = new Date("2026-11-20T10:05:00Z");
  const pollCompletion = new Date("2026-11-20T10:05:05Z");
  const observation = new Date("2026-11-20T10:05:02Z");

  function mapOutage(id: number, startDate: Date, endDate?: Date) {
    return radar.mapResponse({
      success: true,
      result: { outages: [{
        id, asn: 1, asnName: "Example ISP", asnLocation: "Example",
        eventType: "outage", scope: "region", startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
      }] },
    })[0];
  }

  async function saveOutage(id: number, start: Date, observed: Date) {
    const { metadata, ...record } = mapOutage(id, start);
    return db.alert.create({
      data: { ...record, metadata: metadata ? JSON.stringify(metadata) : undefined, lastObservedAt: observed },
    });
  }

  for (const provider of [radar.name, "cloudflare"]) {
    await db.providerState.create({
      data: { provider, lastAttemptAt: pollStart, lastSuccessAt: pollCompletion },
    });
    await db.pollLog.create({
      data: { provider, startedAt: pollStart, completedAt: pollCompletion },
    });
  }

  const omitted = await saveOutage(1, earlier, earlier);
  await db.alert.create({
    data: {
      source: "cloudflare", externalId: "exhaustive-omission", category: "cloud",
      severity: "major", status: "investigating", title: "Past service disruption",
      timestamp: earlier, lastObservedAt: earlier,
    },
  });

  const read = () => db.$transaction((tx) => readDashboardSummary(tx, pollCompletion));
  const radarStatus = (snapshot: Awaited<ReturnType<typeof read>>) =>
    snapshot.providers.find(({ key }) => key === radar.name);

  const missing = await read();
  assert.equal(radarStatus(missing)?.dataState, "incomplete");
  assert.equal(radarStatus(missing)?.status, "unknown");
  assert.equal(missing.observedOutages, 0);
  assert.equal(missing.incidents.total, 0);
  assert.equal(missing.affected.length, 0);
  assert.equal(missing.providers.find(({ key }) => key === "cloudflare")?.status, "operational");

  const observed = await saveOutage(2, pollStart, observation);
  const mixed = await read();
  assert.equal(radarStatus(mixed)?.dataState, "incomplete");
  assert.equal(radarStatus(mixed)?.coverage, "unavailable");
  assert.equal(radarStatus(mixed)?.status, "outage");
  assert.equal(mixed.observedOutages, 1);
  assert.equal(mixed.incidents.total, 0);
  assert.deepEqual(mixed.affected.map(({ id, confidence }) => ({ id, confidence })), [
    { id: observed.id, confidence: "observed" },
  ]);

  for (const { alert, radarId, start } of [
    { alert: omitted, radarId: 1, start: earlier },
    { alert: observed, radarId: 2, start: pollStart },
  ]) {
    const { status, resolvedAt } = mapOutage(radarId, start, observation);
    await db.alert.update({
      where: { id: alert.id },
      data: { status, resolvedAt, lastObservedAt: observation },
    });
  }

  const resolved = await read();
  assert.equal(radarStatus(resolved)?.dataState, "healthy");
  assert.equal(radarStatus(resolved)?.status, "operational");
  assert.equal(resolved.observedOutages, 0);
  assert.equal(resolved.affected.length, 0);
});

test("bounded Slack and PagerDuty polls preserve current incidents when an unresolved incident is missing", async (t) => {
  const db = await createSummaryDb(t);
  const previous = new Date("2026-11-19T10:00:00Z");
  const pollStart = new Date("2026-11-20T10:05:00Z");
  const observed = new Date("2026-11-20T10:05:02Z");
  const completedAt = new Date("2026-11-20T10:05:05Z");

  for (const [provider, category] of [["slack", "cloud"], ["pagerduty", "devops"]]) {
    await db.providerState.create({
      data: { provider, lastAttemptAt: pollStart, lastSuccessAt: completedAt },
    });
    await db.pollLog.create({
      data: { provider, startedAt: pollStart, completedAt },
    });
    const record = {
      source: provider,
      category,
      severity: "major",
      status: "investigating",
      title: "Service disruption",
      timestamp: previous,
    };
    await db.alert.createMany({
      data: [
        { ...record, id: `${provider}-omitted`, externalId: "omitted", lastObservedAt: previous },
        { ...record, id: `${provider}-current`, externalId: "current", lastObservedAt: observed },
        { ...record, externalId: "unconfirmed", lastObservedAt: previous, confidence: "observed" },
      ],
    });
  }

  const read = () => db.$transaction((tx) => readDashboardSummary(tx, completedAt));
  const latest = await read();
  for (const key of ["slack", "pagerduty"]) {
    const source = latest.providers.find((provider) => provider.key === key);
    assert.equal(source?.dataState, "incomplete");
    assert.equal(source.coverage, "unavailable");
    assert.equal(source.status, "outage");
    assert.equal(source.incidents, 1);
  }
  assert.equal(latest.incidents.bySeverity.major, 2);
  assert.deepEqual(latest.affected.map(({ id }) => id).sort(), ["pagerduty-current", "slack-current"]);
  assert.equal(latest.observedOutages, 0);

  await db.alert.updateMany({ where: { externalId: "current" }, data: { status: "resolved" } });
  const missingOnly = await read();
  assert.equal(missingOnly.incidents.total, 0);
  assert.equal(missingOnly.providers.find(({ key }) => key === "slack")?.status, "unknown");

  await db.alert.updateMany({
    where: { externalId: "omitted" },
    data: { status: "resolved", lastObservedAt: observed },
  });
  const resolved = await read();
  for (const key of ["slack", "pagerduty"]) {
    assert.equal(resolved.providers.find((provider) => provider.key === key)?.status, "operational");
  }
});
