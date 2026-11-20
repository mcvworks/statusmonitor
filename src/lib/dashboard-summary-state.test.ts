import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardSummaryState } from "../hooks/useDashboardSummary";
import { advanceSummaryClock, summaryTiming, type SummarySample } from "./dashboard-summary-clock";
import { buildDashboardSummary, type SummarySourceInput } from "./dashboard-snapshot";

const generatedAt = new Date("2026-11-20T03:00:00Z");
const empty = {
  lastPollAt: null,
  sources: [],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
};
const summary = buildDashboardSummary({ ...empty, now: generatedAt });
const sample: SummarySample = {
  summary,
  servedAt: generatedAt.getTime(),
  requestStartedAt: 100,
};

test("a failed refresh immediately makes a cached zero last known", () => {
  const clock = advanceSummaryClock(null, 101, sample);
  const failed = getDashboardSummaryState(sample, true, false, clock);
  assert.equal(failed.summary, summary);
  assert.equal(failed.isLastKnown, true);
  assert.equal(failed.isError, true);
  assert.equal(getDashboardSummaryState(sample, false, false, clock).isLastKnown, false);
});

test("the general snapshot lifetime also runs from generation", () => {
  const cached = { ...sample, servedAt: sample.servedAt + 10_000 };
  const clock = advanceSummaryClock(null, 100, cached);
  assert.equal(getDashboardSummaryState(cached, false, true, advanceSummaryClock(clock, 170_099)).isLastKnown, false);
  assert.equal(getDashboardSummaryState(cached, false, true, advanceSummaryClock(clock, 170_100)).isLastKnown, true);
});

test("loading and failure without a snapshot have no count", () => {
  const loading = getDashboardSummaryState(undefined, false, true, null);
  const failed = getDashboardSummaryState(undefined, true, true, null);
  assert.equal(loading.summary, null);
  assert.equal(loading.isLoading, true);
  assert.equal(failed.summary, null);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isError, true);
});

const pollCompletedAt = new Date("2026-11-20T10:00:00Z");
const deadline = Date.parse("2026-11-20T10:06:00Z");
const source: SummarySourceInput = {
  key: "cloudflare",
  category: "cloud",
  freshnessWindowMs: 6 * 60_000,
  successfulPoll: { startedAt: pollCompletedAt, completedAt: pollCompletedAt },
  hasUnverifiedObservations: false,
  state: { lastSuccessAt: pollCompletedAt, lastError: null, consecutiveFailures: 0 },
};
const sourceSnapshot = {
  ...empty,
  now: new Date(deadline - 5_000),
  lastPollAt: pollCompletedAt,
  sources: [source, { ...source, key: "aws", freshnessWindowMs: 15 * 60_000 }],
};
const cached: SummarySample = {
  summary: buildDashboardSummary(sourceSnapshot),
  servedAt: sourceSnapshot.now.getTime(),
  requestStartedAt: 100,
};

test("a source deadline expires during a pending refresh", () => {
  assert.equal(cached.summary.freshnessExpiresAt, new Date(deadline).toISOString());
  const clock = advanceSummaryClock(null, 100, cached);
  assert.equal(summaryTiming(cached, clock).wakeAt, 5_100);
  const justBefore = advanceSummaryClock(clock, 5_099);
  assert.equal(getDashboardSummaryState(cached, false, false, justBefore).isLastKnown, false);
  const expired = advanceSummaryClock(justBefore, 5_100);
  assert.equal(getDashboardSummaryState(cached, false, false, expired).isLastKnown, true);
});

test("API timing includes server cache age, request time, and delayed delivery despite wall clock skew", (t) => {
  t.mock.method(Date, "now", () => deadline - 60 * 60_000);
  const transport = { ...cached, servedAt: cached.servedAt + 1_000 };
  const receipt = advanceSummaryClock(null, 7_100, transport);
  const state = getDashboardSummaryState(transport, false, false, receipt);
  assert.equal(state.nowMs, deadline + 3_000);
  assert.equal(state.isLastKnown, true);
});

test("hydration includes time since document navigation despite a skewed wall clock", (t) => {
  t.mock.method(Date, "now", () => deadline - 60 * 60_000);
  const initial = { ...cached, requestStartedAt: null };
  assert.equal(getDashboardSummaryState(initial, false, false, null).isLastKnown, false);
  const hydration = advanceSummaryClock(null, 8_000, initial);
  assert.equal(getDashboardSummaryState(initial, false, false, hydration).nowMs, deadline + 3_000);
  assert.equal(getDashboardSummaryState(initial, false, false, hydration).isLastKnown, true);
});

test("clock rollback and a faster replay cannot renew an expired generation", (t) => {
  const wall = t.mock.method(Date, "now", () => deadline);
  const expired = advanceSummaryClock(null, 5_100, cached);
  assert.equal(getDashboardSummaryState(cached, false, false, expired).isLastKnown, true);
  wall.mock.mockImplementation(() => deadline - 60_000);
  const fasterReplay = { ...cached, servedAt: deadline - 2_000, requestStartedAt: 5_200 };
  const replayed = advanceSummaryClock(expired, 5_300, fasterReplay);
  const rolledBack = advanceSummaryClock(replayed, 100);
  assert.equal(getDashboardSummaryState(fasterReplay, false, false, rolledBack).isLastKnown, true);
});

test("a fresh generation recovers after an expired one and the replaced generation stays last known", () => {
  const expired = advanceSummaryClock(null, 8_100, cached);
  const refreshed: SummarySample = {
    summary: buildDashboardSummary({ ...sourceSnapshot, now: new Date(deadline + 4_000) }),
    servedAt: deadline + 4_000,
    requestStartedAt: 8_200,
  };
  const clock = advanceSummaryClock(expired, 8_250, refreshed);
  const state = getDashboardSummaryState(refreshed, false, false, clock);
  assert.equal(state.isLastKnown, false);
  assert.equal(state.summary?.providers[0].status, "unknown");
  assert.equal(state.summary?.providers[1].status, "operational");

  const replaced = advanceSummaryClock(null, 100, cached);
  const newer = advanceSummaryClock(replaced, 101, { ...refreshed, requestStartedAt: 100 });
  assert.equal(getDashboardSummaryState(cached, false, false, newer).isLastKnown, true);
});
