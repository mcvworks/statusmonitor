import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardSummaryState } from "../hooks/useDashboardSummary";
import { buildDashboardSummary, type SummarySourceInput } from "./dashboard-snapshot";

const receivedAt = 1_000_000;
const summary = buildDashboardSummary({
  now: new Date("2026-11-20T03:00:00Z"),
  lastPollAt: null,
  sources: [],
  openAlerts: [],
  advisoriesOpen: 0,
  advisoriesRecent: 0,
});

test("a failed refresh immediately makes a cached zero last known", () => {
  const data = { summary, receivedAt };
  const failed = getDashboardSummaryState(data, true, false, receivedAt + 1, receivedAt);
  assert.equal(failed.summary, summary);
  assert.equal(failed.isLastKnown, true);
  assert.equal(failed.isError, true);

  const recovered = getDashboardSummaryState(data, false, false, receivedAt + 2, receivedAt);
  assert.equal(recovered.isLastKnown, false);
});

test("an expired snapshot stays last known while its replacement is pending", () => {
  const data = { summary, receivedAt };
  const expiresAt = receivedAt + 180_000;
  assert.equal(getDashboardSummaryState(data, false, true, expiresAt - 1, receivedAt).isLastKnown, false);
  assert.equal(getDashboardSummaryState(data, false, true, expiresAt, receivedAt).isLastKnown, true);
  assert.equal(
    getDashboardSummaryState({ summary, receivedAt: null }, false, true, expiresAt, receivedAt).isLastKnown,
    true,
  );
});

test("loading and failure without a snapshot have no count", () => {
  const loading = getDashboardSummaryState(undefined, false, true, 0, 0);
  const failed = getDashboardSummaryState(undefined, true, true, 0, 0);
  assert.equal(loading.summary, null);
  assert.equal(loading.isLoading, true);
  assert.equal(failed.summary, null);
  assert.equal(failed.isLoading, false);
  assert.equal(failed.isError, true);
});

test("a cached source deadline expires during a pending refresh and a new snapshot restores trust", () => {
  const pollCompletedAt = new Date("2026-11-20T10:00:00Z");
  const generatedAt = new Date("2026-11-20T10:05:55Z");
  const deadline = "2026-11-20T10:06:00.000Z";
  const source: SummarySourceInput = {
    key: "cloudflare",
    category: "cloud",
    freshnessWindowMs: 6 * 60_000,
    successfulPoll: { startedAt: pollCompletedAt, completedAt: pollCompletedAt },
    hasUnverifiedObservations: false,
    state: { lastSuccessAt: pollCompletedAt, lastError: null, consecutiveFailures: 0 },
  };
  const input = {
    now: generatedAt,
    lastPollAt: pollCompletedAt,
    sources: [source, { ...source, key: "aws", freshnessWindowMs: 15 * 60_000 }],
    openAlerts: [],
    advisoriesOpen: 0,
    advisoriesRecent: 0,
  };
  const cached = buildDashboardSummary(input);
  assert.equal(cached.providers[0].status, "operational");
  assert.equal(cached.freshnessExpiresAt, deadline);

  const data = { summary: cached, receivedAt };
  const justBefore = getDashboardSummaryState(data, false, true, receivedAt + 4_999, receivedAt);
  assert.equal(justBefore.isLastKnown, false);

  const atDeadline = getDashboardSummaryState(data, false, true, receivedAt + 5_000, receivedAt);
  assert.equal(atDeadline.nowMs, Date.parse(deadline));
  assert.equal(atDeadline.isLastKnown, true);

  // SWR keeps isLoading false during a revalidation when it has cached data.
  const stillPending = getDashboardSummaryState(data, false, false, receivedAt + 15_000, receivedAt);
  assert.equal(stillPending.nowMs, Date.parse("2026-11-20T10:06:10Z"));
  assert.equal(stillPending.isLastKnown, true);
  assert.equal(stillPending.isError, false);
  assert.equal(
    getDashboardSummaryState({ summary: cached, receivedAt: null }, false, false, receivedAt + 5_000, receivedAt).isLastKnown,
    true,
  );

  const refreshed = buildDashboardSummary({ ...input, now: new Date(deadline) });
  assert.equal(refreshed.freshnessExpiresAt, "2026-11-20T10:15:00.000Z");
  assert.equal(refreshed.providers[0].coverage, "stale");
  assert.equal(refreshed.providers[0].status, "unknown");
  assert.equal(refreshed.providers[1].status, "operational");
  assert.equal(
    getDashboardSummaryState({ summary: refreshed, receivedAt: receivedAt + 16_000 }, false, false, receivedAt + 16_000, receivedAt).isLastKnown,
    false,
  );
});
