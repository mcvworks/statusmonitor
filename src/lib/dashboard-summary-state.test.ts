import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardSummaryState } from "../hooks/useDashboardSummary";
import { buildDashboardSummary } from "./dashboard-snapshot";

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
