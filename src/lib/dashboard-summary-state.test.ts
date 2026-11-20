import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardSummaryState } from "../hooks/useDashboardSummary";
import { buildDashboardSummary, type SummarySourceInput } from "./dashboard-snapshot";

const generatedAt = new Date("2026-11-20T03:00:00Z");
const summary = buildDashboardSummary({
  now: generatedAt,
  lastPollAt: null,
  sources: [],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
});

test("a failed refresh immediately makes a cached zero last known", () => {
  const failed = getDashboardSummaryState(summary, true, false, generatedAt.getTime() + 1);
  assert.equal(failed.summary, summary);
  assert.equal(failed.isLastKnown, true);
  assert.equal(failed.isError, true);

  const recovered = getDashboardSummaryState(summary, false, false, generatedAt.getTime() + 2);
  assert.equal(recovered.isLastKnown, false);
});

test("an expired snapshot stays last known while its replacement is pending", () => {
  const expiresAt = generatedAt.getTime() + 180_000;
  assert.equal(getDashboardSummaryState(summary, false, true, expiresAt - 1).isLastKnown, false);
  assert.equal(getDashboardSummaryState(summary, false, true, expiresAt).isLastKnown, true);
});

test("loading and failure without a snapshot have no count", () => {
  const loading = getDashboardSummaryState(undefined, false, true, 0);
  const failed = getDashboardSummaryState(undefined, true, true, 0);
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
  now: new Date(deadline - 5_000),
  lastPollAt: pollCompletedAt,
  sources: [source, { ...source, key: "aws", freshnessWindowMs: 15 * 60_000 }],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
};
const cached = buildDashboardSummary(sourceSnapshot);

test("a cached source deadline expires during a pending refresh and a new snapshot restores trust", () => {
  assert.equal(cached.providers[0].status, "operational");
  assert.equal(cached.freshnessExpiresAt, new Date(deadline).toISOString());

  const justBefore = getDashboardSummaryState(cached, false, false, deadline - 1);
  assert.equal(justBefore.isLastKnown, false);

  // SWR keeps isLoading false during a revalidation when it has cached data.
  const atDeadline = getDashboardSummaryState(cached, false, false, deadline);
  assert.equal(atDeadline.nowMs, deadline);
  assert.equal(atDeadline.isLastKnown, true);

  const stillPending = getDashboardSummaryState(cached, false, false, deadline + 10_000);
  assert.equal(stillPending.nowMs, Date.parse("2026-11-20T10:06:10Z"));
  assert.equal(stillPending.isLastKnown, true);
  assert.equal(stillPending.isError, false);

  const refreshed = buildDashboardSummary({ ...sourceSnapshot, now: new Date(deadline) });
  assert.equal(refreshed.freshnessExpiresAt, "2026-11-20T10:15:00.000Z");
  assert.equal(refreshed.providers[0].coverage, "stale");
  assert.equal(refreshed.providers[0].status, "unknown");
  assert.equal(refreshed.providers[1].status, "operational");
  assert.equal(
    getDashboardSummaryState(refreshed, false, false, deadline + 11_000).isLastKnown,
    false,
  );
});

test("a snapshot delivered by the API after the source deadline is already last known", () => {
  const receipt = deadline + 3_000;
  const atReceipt = getDashboardSummaryState(cached, false, false, receipt);
  assert.equal(atReceipt.nowMs, receipt);
  assert.equal(atReceipt.isLastKnown, true);
  assert.equal(atReceipt.isError, false);
  assert.equal(getDashboardSummaryState(cached, false, false, receipt + 1).isLastKnown, true);
});

test("delayed hydration checks the original deadline with the first browser clock reading", () => {
  const serverRender = getDashboardSummaryState(cached, false, false, 0);
  assert.equal(serverRender.nowMs, deadline - 5_000);
  assert.equal(serverRender.isLastKnown, false);

  const hydration = deadline + 3_000;
  const hydrated = getDashboardSummaryState(cached, false, false, hydration);
  assert.equal(hydrated.nowMs, hydration);
  assert.equal(hydrated.isLastKnown, true);
  assert.equal(getDashboardSummaryState(cached, false, false, hydration + 1).isLastKnown, true);
});
