"use client";

import { useSyncExternalStore } from "react";
import useSWR from "swr";
import type { DashboardSummary } from "@/lib/dashboard-snapshot";

/**
 * Lives under /api/alerts so the existing live stream (useSSE revalidates every
 * "/api/alerts…" key) refreshes it on each alert event, on top of the
 * periodic refresh below.
 */
export const DASHBOARD_SUMMARY_KEY = "/api/alerts/summary";

const REFRESH_MS = 30_000;
/** After this many missed refreshes the snapshot is treated as out of date. */
const OUT_OF_DATE_MS = 3 * 60_000;
const CLOCK_TICK_MS = 15_000;

export interface SummaryEnvelope {
  summary: DashboardSummary;
  /** Browser time when this snapshot arrived; null for the server render. */
  receivedAt: number | null;
}

async function fetchSummary(url: string): Promise<SummaryEnvelope> {
  const response = await fetch(url, { cache: "no-store" });
  // A failed response must surface as an error, never as an empty summary.
  if (!response.ok) {
    throw new Error(`Summary request failed with ${response.status}`);
  }
  const summary = (await response.json()) as Partial<DashboardSummary> | null;
  if (
    !summary ||
    typeof summary.generatedAt !== "string" ||
    !Array.isArray(summary.providers) ||
    !Array.isArray(summary.affected) ||
    typeof summary.incidents?.total !== "number"
  ) {
    throw new Error("Summary response was incomplete");
  }
  return { summary: summary as DashboardSummary, receivedAt: Date.now() };
}

// ─── Shared ticking clock ──────────────────────────────────────
// One interval for every relative time on the page. Read through
// useSyncExternalStore so render stays pure and hydration matches the server.

let clockNow = 0;
let clockStartedAt = 0;
let clockTimer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockNow = Date.now();
    if (clockStartedAt === 0) clockStartedAt = clockNow;
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      for (const notify of clockListeners) notify();
    }, CLOCK_TICK_MS);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

const readClock = () => clockNow;
const readServerClock = () => 0;

export interface DashboardSummaryState {
  /** Null until a snapshot has loaded. Never a made-up zero. */
  summary: DashboardSummary | null;
  /**
   * "Now" on the server's clock: the snapshot time plus the time elapsed in
   * this browser since it arrived. Relative times stay right even when the
   * visitor's own clock is wrong.
   */
  nowMs: number | null;
  /** True while the first snapshot is still loading. */
  isLoading: boolean;
  /** The latest refresh failed. A previous snapshot may still be shown. */
  isError: boolean;
  /** The snapshot on screen is too old to describe the present. */
  isOutOfDate: boolean;
}

export function useDashboardSummary(): DashboardSummaryState {
  const { data, error, isLoading, isValidating } = useSWR<SummaryEnvelope>(
    DASHBOARD_SUMMARY_KEY,
    fetchSummary,
    { refreshInterval: REFRESH_MS },
  );
  const clock = useSyncExternalStore(subscribeClock, readClock, readServerClock);

  const summary = data?.summary ?? null;
  if (!summary) {
    return {
      summary: null,
      nowMs: null,
      isLoading: isLoading && !error,
      isError: !!error,
      isOutOfDate: false,
    };
  }

  const generatedAtMs = new Date(summary.generatedAt).getTime();
  // Before the clock starts (server render and hydration) no time has passed.
  const elapsed =
    clock === 0
      ? 0
      : Math.max(0, clock - (data?.receivedAt ?? clockStartedAt));

  return {
    summary,
    nowMs: generatedAtMs + elapsed,
    isLoading: false,
    isError: !!error,
    // While a refresh of an old cached snapshot is still in flight (for
    // example after navigating back), wait for its result before warning.
    isOutOfDate: elapsed > OUT_OF_DATE_MS && (!!error || !isValidating),
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
