"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import useSWR from "swr";
import type { DashboardSummary } from "@/lib/dashboard-snapshot";
import {
  advanceSummaryClock,
  DASHBOARD_SERVED_AT_HEADER,
  summaryTiming,
  type SummaryClock,
  type SummarySample,
} from "@/lib/dashboard-summary-clock";

/**
 * Lives under /api/alerts so the existing live stream (useSSE revalidates every
 * "/api/alerts…" key) refreshes it on each alert event, on top of the
 * periodic refresh below.
 */
export const DASHBOARD_SUMMARY_KEY = "/api/alerts/summary";

const REFRESH_MS = 30_000;
const CLOCK_TICK_MS = 15_000;

async function fetchSummary(url: string): Promise<SummarySample> {
  const requestStartedAt = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  // A failed response must surface as an error, never as an empty summary.
  if (!response.ok) {
    throw new Error(`Summary request failed with ${response.status}`);
  }
  const servedAt = Number(response.headers.get(DASHBOARD_SERVED_AT_HEADER));
  const summary = (await response.json()) as Partial<DashboardSummary> | null;
  if (
    !summary ||
    typeof summary.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(summary.generatedAt)) ||
    !Number.isFinite(servedAt) || servedAt < Date.parse(summary.generatedAt) ||
    (summary.freshnessExpiresAt !== null &&
      (typeof summary.freshnessExpiresAt !== "string" ||
        !Number.isFinite(Date.parse(summary.freshnessExpiresAt)))) ||
    !Array.isArray(summary.providers) ||
    !Array.isArray(summary.affected) ||
    typeof summary.incidents?.total !== "number"
  ) {
    throw new Error("Summary response was incomplete");
  }
  const sample = { summary: summary as DashboardSummary, servedAt, requestStartedAt };
  updateClock(sample);
  return sample;
}

// ─── Shared ticking clock ──────────────────────────────────────
// One interval for every relative time on the page. Read through
// useSyncExternalStore so render stays pure and hydration matches the server.

let clock: SummaryClock | null = null;
let clockTimer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function updateClock(sample?: SummarySample) {
  const next = advanceSummaryClock(clock, performance.now(), sample);
  if (next === clock) return;
  clock = next;
  for (const notify of clockListeners) notify();
}

const tickClock = () => updateClock();

function subscribeClock(listener: () => void, sample: SummarySample | undefined) {
  // A later-hydrating component can have an older snapshot and clock reading.
  updateClock(sample);
  clockListeners.add(listener);
  if (!clockTimer) {
    clockTimer = setInterval(tickClock, CLOCK_TICK_MS);
    document.addEventListener("visibilitychange", tickClock);
  }

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
      document.removeEventListener("visibilitychange", tickClock);
    }
  };
}

const readClock = () => clock;
const readServerClock = () => null;

export interface DashboardSummaryState {
  /** Null until a snapshot has loaded. Never a made-up zero. */
  summary: DashboardSummary | null;
  /** Server UTC advanced conservatively using the browser monotonic clock. */
  nowMs: number | null;
  /** True while the first snapshot is still loading. */
  isLoading: boolean;
  /** The latest refresh failed. A previous snapshot may still be shown. */
  isError: boolean;
  /** A refresh failed or this snapshot expired. */
  isLastKnown: boolean;
}

export function useDashboardSummary(enabled = true): DashboardSummaryState {
  const { data, error, isLoading } = useSWR<SummarySample>(
    enabled ? DASHBOARD_SUMMARY_KEY : null,
    fetchSummary,
    { refreshInterval: REFRESH_MS },
  );
  const subscribe = useCallback(
    (listener: () => void) => subscribeClock(listener, data),
    [data],
  );
  const currentClock = useSyncExternalStore(
    enabled ? subscribe : subscribeNever, readClock, readServerClock,
  );
  const timing = data ? summaryTiming(data, currentClock) : null;
  const wakeAt = timing?.wakeAt;
  // Source deadlines rarely align with relative-time ticks.
  useEffect(() => {
    if (!enabled || wakeAt == null || wakeAt <= (clock?.monotonicNow ?? 0)) return;
    const deadline = wakeAt;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function wake() {
      const remaining = deadline - performance.now();
      if (remaining <= 0) tickClock();
      else timer = setTimeout(wake, Math.ceil(remaining));
    }
    wake();
    return () => clearTimeout(timer);
  }, [enabled, wakeAt]);

  return getDashboardSummaryState(data, !!error, isLoading, currentClock);
}

export function getDashboardSummaryState(
  sample: SummarySample | undefined,
  failed: boolean,
  loading: boolean,
  currentClock: SummaryClock | null,
): DashboardSummaryState {
  if (!sample) {
    return {
      summary: null,
      nowMs: null,
      isLoading: loading && !failed,
      isError: failed,
      isLastKnown: false,
    };
  }

  const { nowMs, expired } = summaryTiming(sample, currentClock);

  return {
    summary: sample.summary,
    nowMs,
    isLoading: false,
    isError: failed,
    isLastKnown: failed || expired,
  };
}

const subscribeNever = () => () => {};

/** False on the server and during hydration, true once the page is live. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** Age split into a number and a unit, e.g. { value: "4", unit: "min" }. */
export function agePartsOf(
  iso: string | null,
  nowMs: number | null,
): { value: string; unit: string } | null {
  if (!iso || nowMs === null) return null;
  const minutes = Math.floor((nowMs - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return { value: "<1", unit: "min" };
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return { value: String(hours), unit: "h" };
  return { value: String(Math.floor(hours / 24)), unit: "d" };
}

/** "<1 min ago", "4 min ago", "3 h ago", "2 d ago" — compact, for dense labels. */
export function formatAge(iso: string | null, nowMs: number | null): string {
  const parts = agePartsOf(iso, nowMs);
  return parts ? `${parts.value} ${parts.unit} ago` : "—";
}

/** "2026-11-19 20:41 UTC" — the same text on the server and in any browser. */
export function formatUtc(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}
