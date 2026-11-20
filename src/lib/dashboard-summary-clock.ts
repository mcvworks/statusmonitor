import type { DashboardSummary } from "./dashboard-snapshot";

export const DASHBOARD_SERVED_AT_HEADER = "X-Dashboard-Served-At";

const OUT_OF_DATE_MS = 3 * 60_000;

export interface SummarySample {
  summary: DashboardSummary;
  /** UTC time sampled on the server after reading the snapshot. */
  servedAt: number;
  /** Browser monotonic time before fetch, or null for a server render. */
  requestStartedAt: number | null;
}

export interface SummaryClock {
  monotonicNow: number;
  generation: number;
  serverOffset: number;
}

function generationOf(sample: SummarySample): number {
  return Date.parse(sample.summary.generatedAt);
}

function offsetOf(sample: SummarySample): number {
  // The monotonic clock starts with the document. For server-rendered data,
  // that is a conservative start even if a later navigation loaded the data.
  // For an API response, charge the whole request rather than guessing transit
  // time. Only part of that elapsed time can have followed the server sample.
  return sample.servedAt - (sample.requestStartedAt ?? 0);
}

export function advanceSummaryClock(
  previous: SummaryClock | null,
  monotonicNow: number,
  sample?: SummarySample,
): SummaryClock {
  let generation = previous?.generation ?? -Infinity;
  let serverOffset = previous?.serverOffset ?? 0;
  if (sample) {
    const sampleGeneration = generationOf(sample);
    if (sampleGeneration > generation) {
      generation = sampleGeneration;
      serverOffset = offsetOf(sample);
    } else if (sampleGeneration === generation) {
      // Replaying the same snapshot may tighten, but never extend, its trust.
      serverOffset = Math.max(serverOffset, offsetOf(sample));
    }
  }
  const now = Math.max(previous?.monotonicNow ?? 0, monotonicNow);
  return previous?.monotonicNow === now &&
    previous.generation === generation && previous.serverOffset === serverOffset
    ? previous
    : { monotonicNow: now, generation, serverOffset };
}

function effectiveOffset(sample: SummarySample, clock: SummaryClock): number {
  return generationOf(sample) === clock.generation
    ? Math.max(offsetOf(sample), clock.serverOffset)
    : offsetOf(sample);
}

function deadlineOf(summary: DashboardSummary): number {
  const lifetimeDeadline = Date.parse(summary.generatedAt) + OUT_OF_DATE_MS;
  return summary.freshnessExpiresAt
    ? Math.min(lifetimeDeadline, Date.parse(summary.freshnessExpiresAt))
    : lifetimeDeadline;
}

export function summaryTiming(sample: SummarySample, clock: SummaryClock | null) {
  const deadline = deadlineOf(sample.summary);
  const nowMs = clock === null
    ? sample.servedAt
    : clock.monotonicNow + effectiveOffset(sample, clock);
  const replaced = clock !== null && generationOf(sample) < clock.generation;
  return {
    nowMs,
    expired: replaced || nowMs >= deadline,
    wakeAt: clock === null || replaced ? null : deadline - effectiveOffset(sample, clock),
  };
}
