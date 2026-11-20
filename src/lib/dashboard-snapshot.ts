import type { AlertCategory, AlertSeverity } from "./alert-schema";
import { SEVERITY_ORDER } from "./constants";
import type { ProviderStatus } from "./provider-status";
import { isAdvisorySignal, isOperationalSignal } from "./signal-kind";

/**
 * Pure rules behind the homepage summary. No database or network access here,
 * so the same rules can be unit-tested and reused for typing on the client.
 *
 * What counts as happening "now":
 * - the source itself must be fresh (same freshness rule as provider health);
 * - the record must still have been listed by that source at its latest
 *   successful check; and
 * - its open state must be the source's own statement. Sources that publish
 *   dated updates for a record track its lifecycle themselves, so such a
 *   record is open for as long as the source lists it, however old it is.
 *   Where the open state is only read out of feed text (no dated updates),
 *   old items stay "open" forever, so those count only if they started within
 *   CURRENT_INCIDENT_WINDOW_DAYS.
 * Open records that fail the last test are reported separately as "older open
 * records": they are never counted as current incidents, and their provider is
 * never shown as operational.
 */

/**
 * Open records without dated source updates that started longer ago than
 * this are not "now".
 */
export const CURRENT_INCIDENT_WINDOW_DAYS = 7;
/** A record counts as listed at the latest check if seen this close to it. */
export const VERIFY_TOLERANCE_MS = 2 * 60_000;
/** Records dated further ahead than this are announcements, not incidents. */
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export type SourceDataState =
  | "healthy"
  | "error"
  | "stale"
  | "not_configured"
  | "pending";

/** Coverage bucket shown to visitors. Only "fresh" sources can be trusted now. */
export type SourceCoverage = "fresh" | "stale" | "unavailable";

/** What a source is for: a service's status, security advisories, or crowd reports. */
export type SourceRole = "service" | "advisory" | "community";

export type SignalClass =
  | "confirmed"
  | "observed"
  | "unconfirmed"
  | "advisory"
  | "maintenance";

const SEVERITIES: AlertSeverity[] = ["critical", "major", "minor", "info"];

/** Sources whose records are crowd reports rather than a provider's own status. */
const COMMUNITY_SOURCES = new Set(["downdetector"]);

export interface SummarySourceInput {
  key: string;
  category: AlertCategory;
  /** Null when no adapter is registered for this source. */
  freshnessWindowMs: number | null;
  state: {
    lastSuccessAt: Date | null;
    lastError: string | null;
    consecutiveFailures: number;
  } | null;
}

export interface SummaryAlertInput {
  id: string;
  source: string;
  title: string;
  severity: string;
  status: string;
  signalKind: string;
  confidence: string;
  timestamp: Date;
  lastObservedAt: Date;
  /** Latest structured update published by the source, when it provides them. */
  lastUpdateAt: Date | null;
}

export interface SummaryProvider {
  key: string;
  role: SourceRole;
  dataState: SourceDataState;
  coverage: SourceCoverage;
  /**
   * "operational" only when the source is fresh and lists nothing open.
   * "unknown" when the source is not fresh, or when it has no current
   * incident but still lists older open records.
   */
  status: ProviderStatus;
  lastSuccessAt: string | null;
  /** Current incidents (confirmed or observed) from this source. */
  incidents: number;
  /** How many of those are observed outages rather than confirmed incidents. */
  observed: number;
  /** Still listed as open by the source, but too old to count as current. */
  olderOpen: number;
  /**
   * For sources that are not fresh: incidents that were current at their last
   * good check. Reported as last-known, never counted as happening now.
   */
  openAtLastCheck: number;
}

export interface SummaryAffected {
  source: string;
  status: ProviderStatus;
  /** The most severe, then most recent, current incident for this source. */
  id: string;
  title: string;
  severity: AlertSeverity;
  alertStatus: string;
  confidence: string;
  startedAt: string;
  lastObservedAt: string;
  /** Further current incidents from the same source. */
  more: number;
}

export interface DashboardSummary {
  generatedAt: string;
  /** Last successful check of any source, or null if none has succeeded. */
  lastPollAt: string | null;
  windowDays: number;
  /** Officially reported or corroborated incidents that are current. */
  incidents: {
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    providers: number;
  };
  /** Observed (not officially confirmed) internet outages that are current. */
  observedOutages: number;
  /** Older open records. Never part of incidents.total. */
  olderOpen: { total: number; providers: number };
  /** Advisories are never incidents. */
  advisories: { open: number; recent: number };
  /** Community or crowdsourced reports. Never incidents. */
  unconfirmedSignals: number;
  coverage: { total: number; fresh: number; stale: number; unavailable: number };
  providers: SummaryProvider[];
  affected: SummaryAffected[];
}

export function classifySignal(alert: {
  signalKind: string;
  confidence: string;
}): SignalClass {
  const signal = alert as Parameters<typeof isOperationalSignal>[0];
  if (isAdvisorySignal(signal)) return "advisory";
  if (alert.signalKind === "maintenance") return "maintenance";
  if (!isOperationalSignal(signal) || alert.confidence === "crowdsourced") {
    return "unconfirmed";
  }
  // Observed outages keep their operational meaning but are not "confirmed".
  if (alert.confidence === "observed") return "observed";
  return "confirmed";
}

export function deriveDataState(
  source: SummarySourceInput,
  nowMs: number,
): SourceDataState {
  const { state, freshnessWindowMs } = source;
  if (!state || freshnessWindowMs === null) return "pending";
  if (state.lastError?.toLowerCase().includes("not configured")) {
    return "not_configured";
  }
  if (
    !state.lastSuccessAt ||
    nowMs - state.lastSuccessAt.getTime() > freshnessWindowMs
  ) {
    return "stale";
  }
  return state.consecutiveFailures > 0 ? "error" : "healthy";
}

/**
 * "stale" means there was good data that has since gone old. A source that
 * has never been read successfully has nothing to go stale: it is unavailable.
 */
export function coverageOf(
  state: SourceDataState,
  hasSucceeded: boolean,
): SourceCoverage {
  if (state === "healthy") return "fresh";
  return state === "stale" && hasSucceeded ? "stale" : "unavailable";
}

/** A source's role, from its registry key and category. */
export function sourceRole(
  key: string,
  category: AlertCategory | undefined,
): SourceRole {
  if (category === "security") return "advisory";
  return COMMUNITY_SOURCES.has(key) ? "community" : "service";
}

function severityRank(severity: string): number {
  return SEVERITY_ORDER[severity as AlertSeverity] ?? SEVERITY_ORDER.info;
}

function asSeverity(severity: string): AlertSeverity {
  return SEVERITIES.includes(severity as AlertSeverity)
    ? (severity as AlertSeverity)
    : "info";
}

function activityMs(alert: SummaryAlertInput): number {
  return Math.max(
    alert.timestamp.getTime(),
    alert.lastUpdateAt?.getTime() ?? 0,
  );
}

/**
 * Whether a record the source still lists as open describes the present.
 * See the rules at the top of this file.
 */
function isCurrent(alert: SummaryAlertInput, cutoffMs: number): boolean {
  return alert.lastUpdateAt !== null || alert.timestamp.getTime() >= cutoffMs;
}

/**
 * Some feeds publish one record per update, all with the same headline.
 * Collapse those so one incident is counted once, keeping the most severe
 * and then the most recently active record.
 */
function distinctByTitle(alerts: SummaryAlertInput[]): SummaryAlertInput[] {
  const best = new Map<string, SummaryAlertInput>();
  for (const alert of alerts) {
    const key = alert.title.trim().toLowerCase();
    const current = best.get(key);
    if (
      !current ||
      severityRank(alert.severity) < severityRank(current.severity) ||
      (severityRank(alert.severity) === severityRank(current.severity) &&
        activityMs(alert) > activityMs(current))
    ) {
      best.set(key, alert);
    }
  }
  return [...best.values()].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      activityMs(b) - activityMs(a),
  );
}

export function buildDashboardSummary(input: {
  now: Date;
  sources: SummarySourceInput[];
  /** Unresolved operational records and community signals. */
  openAlerts: SummaryAlertInput[];
  advisoriesOpen: number;
  advisoriesRecent: number;
}): DashboardSummary {
  const nowMs = input.now.getTime();
  const currentCutoff = nowMs - CURRENT_INCIDENT_WINDOW_DAYS * DAY_MS;

  const bySource = new Map<string, SummaryAlertInput[]>();
  for (const alert of input.openAlerts) {
    const list = bySource.get(alert.source);
    if (list) list.push(alert);
    else bySource.set(alert.source, [alert]);
  }

  const bySeverity: Record<AlertSeverity, number> = {
    critical: 0,
    major: 0,
    minor: 0,
    info: 0,
  };
  const coverage = { total: 0, fresh: 0, stale: 0, unavailable: 0 };
  const providers: SummaryProvider[] = [];
  const affected: Array<{ row: SummaryAffected; activity: number }> = [];
  let confirmedTotal = 0;
  let confirmedProviders = 0;
  let observedOutages = 0;
  let unconfirmedSignals = 0;
  let olderTotal = 0;
  let olderProviders = 0;
  let lastPollMs = 0;

  for (const source of input.sources) {
    const dataState = deriveDataState(source, nowMs);
    const lastSuccessMs = source.state?.lastSuccessAt?.getTime() ?? null;
    const sourceCoverage = coverageOf(dataState, lastSuccessMs !== null);
    coverage.total += 1;
    coverage[sourceCoverage] += 1;

    if (lastSuccessMs !== null && lastSuccessMs > lastPollMs) {
      lastPollMs = lastSuccessMs;
    }

    // Only records the source still listed at its latest successful check.
    const listed =
      lastSuccessMs === null
        ? []
        : (bySource.get(source.key) ?? []).filter(
            (alert) =>
              alert.lastObservedAt.getTime() >=
                lastSuccessMs - VERIFY_TOLERANCE_MS &&
              alert.timestamp.getTime() <= nowMs + FUTURE_TOLERANCE_MS,
          );
    const operational = listed.filter((alert) => {
      const signalClass = classifySignal(alert);
      return signalClass === "confirmed" || signalClass === "observed";
    });

    const provider: SummaryProvider = {
      key: source.key,
      role: sourceRole(source.key, source.category),
      dataState,
      coverage: sourceCoverage,
      status: "unknown",
      lastSuccessAt: source.state?.lastSuccessAt?.toISOString() ?? null,
      incidents: 0,
      observed: 0,
      olderOpen: 0,
      openAtLastCheck: 0,
    };
    providers.push(provider);

    if (sourceCoverage !== "fresh") {
      // Cannot be confirmed now: report what was open, claim nothing. Older
      // open records are left out here too, as they would be for a fresh source.
      provider.openAtLastCheck = distinctByTitle(
        operational.filter((alert) => isCurrent(alert, currentCutoff)),
      ).length;
      continue;
    }

    unconfirmedSignals += listed.filter(
      (alert) => classifySignal(alert) === "unconfirmed",
    ).length;

    const current = distinctByTitle(
      operational.filter((alert) => isCurrent(alert, currentCutoff)),
    );
    const currentTitles = new Set(
      current.map((alert) => alert.title.trim().toLowerCase()),
    );
    const older = distinctByTitle(
      operational.filter((alert) => !isCurrent(alert, currentCutoff)),
    ).filter((alert) => !currentTitles.has(alert.title.trim().toLowerCase()));

    provider.incidents = current.length;
    provider.olderOpen = older.length;
    if (older.length > 0) {
      olderTotal += older.length;
      olderProviders += 1;
    }

    if (current.length === 0) {
      // Operational only when the source lists nothing open at all. Older
      // open records are not incidents, but they are not an all-clear either.
      if (older.length === 0) provider.status = "operational";
      continue;
    }

    const confirmed = current.filter(
      (alert) => classifySignal(alert) === "confirmed",
    );
    for (const alert of confirmed) bySeverity[asSeverity(alert.severity)] += 1;
    confirmedTotal += confirmed.length;
    if (confirmed.length > 0) confirmedProviders += 1;
    provider.observed = current.length - confirmed.length;
    observedOutages += provider.observed;

    const top = current[0];
    const worst = asSeverity(top.severity);
    provider.status =
      worst === "critical" || worst === "major" ? "outage" : "degraded";
    affected.push({
      row: {
        source: source.key,
        status: provider.status,
        id: top.id,
        title: top.title,
        severity: worst,
        alertStatus: top.status,
        confidence: top.confidence,
        startedAt: top.timestamp.toISOString(),
        lastObservedAt: top.lastObservedAt.toISOString(),
        more: current.length - 1,
      },
      activity: activityMs(top),
    });
  }

  affected.sort(
    (a, b) =>
      severityRank(a.row.severity) - severityRank(b.row.severity) ||
      b.activity - a.activity,
  );

  return {
    generatedAt: input.now.toISOString(),
    lastPollAt: lastPollMs > 0 ? new Date(lastPollMs).toISOString() : null,
    windowDays: CURRENT_INCIDENT_WINDOW_DAYS,
    incidents: {
      total: confirmedTotal,
      bySeverity,
      providers: confirmedProviders,
    },
    observedOutages,
    olderOpen: { total: olderTotal, providers: olderProviders },
    advisories: {
      open: input.advisoriesOpen,
      recent: input.advisoriesRecent,
    },
    unconfirmedSignals,
    coverage,
    providers,
    affected: affected.map((entry) => entry.row),
  };
}
