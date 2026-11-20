"use client";

import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import type { DashboardSummary } from "@/lib/dashboard-snapshot";

/**
 * Lives under /api/alerts so the existing live stream (useSSE revalidates every
 * "/api/alerts…" key) refreshes it on each alert event, on top of the
 * periodic refresh below.
 */
export const DASHBOARD_SUMMARY_KEY = "/api/alerts/summary";

const REFRESH_MS = 30_000;
/** Maximum time to present a snapshot as current. */
const OUT_OF_DATE_MS = 3 * 60_000;
const CLOCK_TICK_MS = 15_000;

async function fetchSummary(url: string): Promise<DashboardSummary> {
  const response = await fetch(url, { cache: "no-store" });
  // A failed response must surface as an error, never as an empty summary.
  if (!response.ok) {
    throw new Error(`Summary request failed with ${response.status}`);
  }
  const summary = (await response.json()) as Partial<DashboardSummary> | null;
  if (
    !summary ||
    typeof summary.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(summary.generatedAt)) ||
    (summary.freshnessExpiresAt !== null &&
      (typeof summary.freshnessExpiresAt !== "string" ||
        !Number.isFinite(Date.parse(summary.freshnessExpiresAt)))) ||
    !Array.isArray(summary.providers) ||
    !Array.isArray(summary.affected) ||
    typeof summary.incidents?.total !== "number"
  ) {
    throw new Error("Summary response was incomplete");
  }
  // Publish the time at delivery before SWR renders the new data. The last
  // relative-time tick may predate the deadline of a slow response.
  updateClock();
  return summary as DashboardSummary;
}

function snapshotDeadlineMs(summary: DashboardSummary): number {
  const snapshotDeadline = Date.parse(summary.generatedAt) + OUT_OF_DATE_MS;
  return summary.freshnessExpiresAt
    ? Math.min(snapshotDeadline, Date.parse(summary.freshnessExpiresAt))
    : snapshotDeadline;
}

// ─── Shared ticking clock ──────────────────────────────────────
// One interval for every relative time on the page. Read through
// useSyncExternalStore so render stays pure and hydration matches the server.

let clockNow = 0;
let clockTimer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function updateClock() {
  const now = Date.now();
  if (now === clockNow) return;
  clockNow = now;
  for (const notify of clockListeners) notify();
}

function subscribeClock(
  listener: () => void,
  deadline: number | null,
) {
  // A later-hydrating component must not use a tick from before its mount.
  updateClock();
  clockListeners.add(listener);
  if (!clockTimer) {
    clockTimer = setInterval(updateClock, CLOCK_TICK_MS);
    document.addEventListener("visibilitychange", updateClock);
  }

  // Source deadlines rarely align with relative-time ticks. Wake the shared
  // clock at expiry even when the refresh is still in flight.
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  if (deadline !== null && deadline > clockNow) {
    deadlineTimer = setTimeout(updateClock, Math.max(0, deadline - Date.now()));
  }

  return () => {
    clearTimeout(deadlineTimer);
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
      document.removeEventListener("visibilitychange", updateClock);
    }
  };
}

const readClock = () => clockNow;
const readServerClock = () => 0;

export interface DashboardSummaryState {
  /** Null until a snapshot has loaded. Never a made-up zero. */
  summary: DashboardSummary | null;
  /** Snapshot time on the server render, then the current browser UTC time. */
  nowMs: number | null;
  /** True while the first snapshot is still loading. */
  isLoading: boolean;
  /** The latest refresh failed. A previous snapshot may still be shown. */
  isError: boolean;
  /** A refresh failed or this snapshot expired. */
  isLastKnown: boolean;
}

export function useDashboardSummary(enabled = true): DashboardSummaryState {
  const { data, error, isLoading } = useSWR<DashboardSummary>(
    enabled ? DASHBOARD_SUMMARY_KEY : null,
    fetchSummary,
    { refreshInterval: REFRESH_MS },
  );
  const deadline = data ? snapshotDeadlineMs(data) : null;
  const subscribe = useCallback(
    (listener: () => void) => subscribeClock(listener, deadline),
    [deadline],
  );
  const clock = useSyncExternalStore(enabled ? subscribe : subscribeNever, readClock, readServerClock);
  return getDashboardSummaryState(data, !!error, isLoading, clock);
}

export function getDashboardSummaryState(
  summary: DashboardSummary | undefined,
  failed: boolean,
  loading: boolean,
  clock: number,
): DashboardSummaryState {
  if (!summary) {
    return {
      summary: null,
      nowMs: null,
      isLoading: loading && !failed,
      isError: failed,
      isLastKnown: false,
    };
  }

  // Match the server HTML during hydration. Once subscribed, the clock
  // is already at the actual browser time, including pre-hydration delay.
  const nowMs = clock || Date.parse(summary.generatedAt);

  return {
    summary,
    nowMs,
    isLoading: false,
    isError: failed,
    isLastKnown: failed || nowMs >= snapshotDeadlineMs(summary),
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
