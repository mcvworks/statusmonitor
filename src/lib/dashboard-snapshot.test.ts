import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDashboardSummary,
  classifySignal,
  type SummaryAlertInput,
  type SummarySourceInput,
} from "./dashboard-snapshot";

const NOW = new Date("2026-11-19T12:00:00.000Z");
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function ago(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

function source(
  key: string,
  overrides: Partial<SummarySourceInput> = {},
): SummarySourceInput {
  const state = overrides.state === undefined
    ? { lastSuccessAt: ago(MINUTE), lastError: null, consecutiveFailures: 0 }
    : overrides.state;
  return {
    key,
    category: "cloud",
    freshnessWindowMs: 6 * MINUTE,
    hasUnverifiedObservations: false,
    successfulPoll: state?.lastSuccessAt ? {
      startedAt: new Date(state.lastSuccessAt.getTime() - 10_000),
      completedAt: state.lastSuccessAt,
    } : null,
    ...overrides,
    state,
  };
}

let nextId = 0;
function alert(overrides: Partial<SummaryAlertInput> = {}): SummaryAlertInput {
  nextId += 1;
  return {
    id: `alert-${nextId}`,
    source: "cloudflare",
    title: `Incident ${nextId}`,
    severity: "minor",
    status: "investigating",
    signalKind: "incident",
    confidence: "official",
    timestamp: ago(30 * MINUTE),
    lastObservedAt: ago(MINUTE),
    lastUpdateAt: null,
    ...overrides,
  };
}

function summarize(
  sources: SummarySourceInput[],
  openAlerts: SummaryAlertInput[],
  advisories = { open: 0, recent: 0 },
  lastPollAt: Date | null = null,
) {
  return buildDashboardSummary({
    now: NOW,
    lastPollAt,
    sources,
    openAlerts,
    advisoriesOpen: advisories.open,
    advisoriesRecent: advisories.recent,
  });
}

test("signals are classified into distinct kinds", () => {
  assert.equal(classifySignal({ signalKind: "incident", confidence: "official" }), "confirmed");
  assert.equal(classifySignal({ signalKind: "incident", confidence: "corroborated" }), "confirmed");
  assert.equal(classifySignal({ signalKind: "internet_outage", confidence: "observed" }), "observed");
  assert.equal(classifySignal({ signalKind: "incident", confidence: "observed" }), "unconfirmed");
  assert.equal(classifySignal({ signalKind: "community_signal", confidence: "crowdsourced" }), "unconfirmed");
  assert.equal(classifySignal({ signalKind: "incident", confidence: "crowdsourced" }), "unconfirmed");
  assert.equal(classifySignal({ signalKind: "advisory", confidence: "official" }), "advisory");
  assert.equal(classifySignal({ signalKind: "maintenance", confidence: "official" }), "maintenance");
});

test("advisories and unconfirmed signals stay out of the confirmed total", () => {
  const summary = summarize(
    [
      source("cloudflare"),
      source("downdetector", { freshnessWindowMs: 15 * MINUTE }),
      source("nvd", { category: "security", freshnessWindowMs: 15 * MINUTE }),
    ],
    [
      alert({ severity: "major" }),
      alert({ severity: "critical", confidence: "observed" }),
      alert({
        source: "downdetector",
        signalKind: "community_signal",
        confidence: "crowdsourced",
        severity: "critical",
      }),
    ],
    { open: 48001, recent: 12 },
  );

  assert.equal(summary.incidents.total, 1);
  assert.deepEqual(summary.incidents.bySeverity, {
    critical: 0,
    major: 1,
    minor: 0,
    info: 0,
  });
  assert.equal(summary.unconfirmedSignals, 2);
  assert.equal(summary.observedOutages, 0);
  assert.deepEqual(summary.advisories, { open: 48001, recent: 12 });
  assert.equal(summary.affected.length, 1);
  assert.equal(summary.affected[0].source, "cloudflare");
  // The crowd-report and advisory sources never turn into affected services.
  const roles = Object.fromEntries(summary.providers.map((p) => [p.key, p.role]));
  assert.deepEqual(roles, {
    cloudflare: "service",
    downdetector: "community",
    nvd: "advisory",
  });
});

test("severity counts always add up to the confirmed total", () => {
  const summary = summarize(
    [source("cloudflare"), source("github"), source("cloudflare-radar")],
    [
      alert({ severity: "critical" }),
      alert({ severity: "minor" }),
      alert({ source: "github", severity: "major" }),
      alert({
        source: "cloudflare-radar",
        signalKind: "internet_outage",
        confidence: "observed",
        severity: "critical",
      }),
    ],
  );
  const counted = Object.values(summary.incidents.bySeverity).reduce(
    (sum, count) => sum + count,
    0,
  );
  assert.equal(counted, summary.incidents.total);
  assert.equal(summary.incidents.total, 3);
  assert.equal(summary.incidents.providers, 2);
});

test("observed outages stay operational but are not counted as confirmed", () => {
  const summary = summarize(
    [source("cloudflare-radar", { category: "isp", freshnessWindowMs: 15 * MINUTE })],
    [
      alert({
        source: "cloudflare-radar",
        signalKind: "internet_outage",
        confidence: "observed",
        severity: "critical",
      }),
    ],
  );

  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.observedOutages, 1);
  assert.equal(summary.unconfirmedSignals, 0);
  assert.equal(summary.providers[0].status, "outage");
  assert.equal(summary.providers[0].incidents, 1);
  assert.equal(summary.providers[0].observed, 1);
  assert.equal(summary.affected[0].confidence, "observed");
});

test("stale, unavailable, and missing sources are never operational", () => {
  const summary = summarize(
    [
      source("fresh"),
      source("stale", {
        state: { lastSuccessAt: ago(20 * MINUTE), lastError: null, consecutiveFailures: 0 },
      }),
      source("failing", {
        state: { lastSuccessAt: ago(MINUTE), lastError: "HTTP 500", consecutiveFailures: 2 },
      }),
      source("unconfigured", {
        state: {
          lastSuccessAt: null,
          lastError: "Downdetector is not configured",
          consecutiveFailures: 4,
        },
      }),
      source("never-polled", { state: null }),
      source("no-adapter", { freshnessWindowMs: null }),
    ],
    [],
  );

  const byKey = Object.fromEntries(summary.providers.map((p) => [p.key, p]));
  assert.equal(byKey.fresh.status, "operational");
  assert.equal(byKey.fresh.coverage, "fresh");
  for (const key of ["stale", "failing", "unconfigured", "never-polled", "no-adapter"]) {
    assert.equal(byKey[key].status, "unknown", key);
    assert.notEqual(byKey[key].coverage, "fresh", key);
  }
  assert.equal(byKey.stale.coverage, "stale");
  // Never read successfully: nothing to go stale, so it is unavailable.
  assert.equal(byKey.unconfigured.coverage, "unavailable");
  assert.equal(byKey["never-polled"].coverage, "unavailable");
  assert.equal(byKey.failing.dataState, "error");
  assert.equal(byKey.unconfigured.dataState, "not_configured");
  assert.equal(byKey["never-polled"].dataState, "pending");
  assert.deepEqual(summary.coverage, { total: 6, fresh: 1, stale: 1, unavailable: 4 });
});

test("a source that has never succeeded is unavailable, not stale", () => {
  const summary = summarize(
    [source("datadog", { state: { lastSuccessAt: null, lastError: "HTTP 403", consecutiveFailures: 6 } })],
    [],
  );
  assert.equal(summary.providers[0].dataState, "stale");
  assert.equal(summary.providers[0].coverage, "unavailable");
  assert.equal(summary.providers[0].status, "unknown");
  assert.deepEqual(summary.coverage, { total: 1, fresh: 0, stale: 0, unavailable: 1 });
});

test("a stale source confirms nothing but reports what was open at its last check", () => {
  const lastSuccessAt = ago(40 * MINUTE);
  const summary = summarize(
    [source("m365", { state: { lastSuccessAt, lastError: "timeout", consecutiveFailures: 9 } })],
    [alert({ source: "m365", severity: "major", lastObservedAt: new Date(lastSuccessAt.getTime() - 5_000) })],
  );

  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.affected.length, 0);
  assert.equal(summary.providers[0].status, "unknown");
  assert.equal(summary.providers[0].openAtLastCheck, 1);
});

test("last-known incidents keep distinct IDs and older open records", () => {
  const lastSuccessAt = ago(3 * MINUTE);
  const listed = new Date(lastSuccessAt.getTime() - 5_000);
  const summary = summarize(
    // Read successfully three minutes ago, but the latest attempt failed.
    [source("fastly", { state: { lastSuccessAt, lastError: "fetch failed", consecutiveFailures: 1 } })],
    [
      alert({ source: "fastly", title: "Elevated errors in Osaka", lastObservedAt: listed }),
      alert({ source: "fastly", title: "Elevated errors in Osaka", status: "monitoring", lastObservedAt: listed }),
      // Still listed as open, but 40 days old with no dated updates.
      alert({ source: "fastly", title: "Increased error rates in Frankfurt", timestamp: ago(40 * DAY), lastObservedAt: listed }),
    ],
  );

  assert.equal(summary.providers[0].dataState, "error");
  assert.equal(summary.providers[0].coverage, "unavailable");
  assert.equal(summary.providers[0].status, "unknown");
  assert.equal(summary.providers[0].openAtLastCheck, 3);
  assert.equal(summary.providers[0].incidents, 0);
  assert.equal(summary.incidents.total, 0);
});

test("observations use the successful poll bounds even when the poll ran for over two minutes", () => {
  const startedAt = ago(5 * MINUTE);
  const completedAt = ago(MINUTE);
  const summary = summarize(
    [source("cloudflare", { successfulPoll: { startedAt, completedAt } })],
    [
      alert({ id: "early-in-slow-poll", lastObservedAt: startedAt, severity: "major" }),
      alert({ id: "at-completion", lastObservedAt: completedAt }),
      alert({ id: "before-poll", lastObservedAt: new Date(startedAt.getTime() - 1), severity: "critical" }),
      alert({ id: "after-poll", lastObservedAt: new Date(completedAt.getTime() + 1), severity: "critical" }),
    ],
  );
  assert.equal(summary.incidents.total, 2);
  assert.deepEqual(summary.incidents.bySeverity, { critical: 0, major: 1, minor: 1, info: 0 });
  assert.equal(summary.affected[0].id, "early-in-slow-poll");
});

test("a record from just before a short successful poll is not current", () => {
  const summary = summarize(
    [source("cloudflare")],
    [alert({ lastObservedAt: ago(MINUTE + 11_000) })],
  );
  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.providers[0].status, "operational");
});

test("a recent provider state without a completed successful poll cannot establish an all-clear", () => {
  const summary = summarize([source("cloudflare", { successfulPoll: null })], [alert()]);
  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.providers[0].status, "unknown");
  assert.equal(summary.providers[0].dataState, "unverified");
  assert.equal(summary.coverage.fresh, 0);
});

test("records a fresh source no longer lists are not current", () => {
  const summary = summarize(
    [source("stripe")],
    [alert({ source: "stripe", lastObservedAt: ago(3 * DAY) })],
  );

  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.providers[0].status, "operational");
});

test("records on fresh sources follow recorded status regardless of age or dated updates", () => {
  const summary = summarize(
    [source("okta"), source("cloudflare")],
    [
      alert({ source: "okta", title: "Service disruption", severity: "major", timestamp: ago(587 * DAY) }),
      alert({ source: "okta", title: "Service degradation", status: "monitoring", timestamp: ago(90 * DAY) }),
      alert({ title: "Workers events delayed", timestamp: ago(10 * DAY), lastUpdateAt: ago(DAY) }),
      alert({ source: "okta", status: "resolved", severity: "critical" }),
    ],
  );

  assert.equal(summary.incidents.total, 3);
  assert.deepEqual(summary.incidents.bySeverity, { critical: 0, major: 1, minor: 2, info: 0 });
  assert.equal(summary.providers[0].incidents, 2);
  assert.equal(summary.providers[0].status, "outage");
  assert.deepEqual(summary.affected.map((row) => row.source), ["okta", "cloudflare"]);
  assert.equal(summary.affected[0].more, 1);
});

test("distinct records with repeated headlines each count once", () => {
  const summary = summarize(
    [source("fastly")],
    [
      alert({ source: "fastly", title: "North America with Possible Impact", status: "investigating" }),
      alert({ source: "fastly", title: "North America with Possible Impact", status: "active" }),
      alert({ source: "fastly", title: "north america with possible impact ", severity: "major" }),
      alert({ source: "fastly", title: "Elevated errors in Osaka" }),
    ],
  );

  assert.equal(summary.incidents.total, 4);
  assert.equal(summary.affected.length, 1);
  assert.equal(summary.affected[0].severity, "major");
  assert.equal(summary.affected[0].more, 3);
  assert.equal(summary.providers[0].status, "outage");
});

test("announcements dated in the future are not incidents", () => {
  const summary = summarize(
    [source("fastly")],
    [alert({ source: "fastly", timestamp: new Date(NOW.getTime() + 11 * DAY) })],
  );

  assert.equal(summary.incidents.total, 0);
  assert.equal(summary.providers[0].status, "operational");
});

test("affected rows list the most severe provider first", () => {
  const summary = summarize(
    [source("github"), source("cloudflare"), source("twilio")],
    [
      alert({ source: "github", severity: "minor", timestamp: ago(5 * MINUTE) }),
      alert({ source: "cloudflare", severity: "critical", timestamp: ago(3 * 60 * MINUTE) }),
      alert({ source: "twilio", severity: "minor", timestamp: ago(60 * MINUTE) }),
    ],
  );

  assert.deepEqual(
    summary.affected.map((row) => `${row.source}:${row.status}`),
    ["cloudflare:outage", "github:degraded", "twilio:degraded"],
  );
});

test("the last completed poll comes from the poll log independently of source health", () => {
  const lastPollAt = ago(10_000);
  const sources = [source("a"), source("b", { state: null })];
  const summary = summarize(sources, [], undefined, lastPollAt);
  assert.equal(summary.lastPollAt, lastPollAt.toISOString());
  assert.equal(summarize(sources, []).lastPollAt, null);
});
