"use client";

import Link from "next/link";
import type { SerializedAlert } from "@/lib/alert-schema";
import { PROVIDERS } from "@/lib/constants";
import {
  deriveProviderStatus,
  PROVIDER_STATUS_STYLES,
} from "@/lib/provider-status";
import type { SummaryProvider } from "@/lib/dashboard-snapshot";
import { useAlerts } from "@/hooks/useAlerts";
import { useActivity } from "@/hooks/useActivity";
import { useProviderHealth } from "@/hooks/useProviderHealth";
import {
  formatAge,
  formatUtc,
  useDashboardSummary,
} from "@/hooks/useDashboardSummary";
import { isOperationalSignal } from "@/lib/signal-kind";
import { MONO, plural, providerName } from "./console-labels";
import { ProviderIcon } from "./ProviderIcon";
import { Sparkline } from "./Sparkline";

interface StatusOverviewProps {
  sourceFilter?: string[];
  /**
   * "grid" is the provider grid with sparklines (personal dashboard).
   * "rail" is the homepage's narrow triage list.
   */
  variant?: "grid" | "rail";
}

export function StatusOverview({
  sourceFilter,
  variant = "grid",
}: StatusOverviewProps = {}) {
  return variant === "rail" ? (
    <ProviderRail />
  ) : (
    <ProviderGrid sourceFilter={sourceFilter} />
  );
}

function ProviderGrid({ sourceFilter }: { sourceFilter?: string[] }) {
  const { alerts, isLoading } = useAlerts();
  const { activity } = useActivity();
  const { providers: providerHealth } = useProviderHealth();

  // Group alerts by source
  const alertsBySource: Record<string, SerializedAlert[]> = {};
  for (const alert of alerts) {
    if (!alertsBySource[alert.source]) alertsBySource[alert.source] = [];
    alertsBySource[alert.source].push(alert);
  }

  // Build provider status list, optionally filtered by selected services
  const entries = Object.entries(PROVIDERS);
  const filteredEntries = sourceFilter
    ? entries.filter(([key]) => sourceFilter.includes(key))
    : entries;
  const providerEntries = filteredEntries.map(([key, meta]) => {
    const dataHealth = providerHealth[key];
    const operationalAlerts = (alertsBySource[key] ?? []).filter(isOperationalSignal);
    const status =
      !dataHealth || dataHealth.state !== "healthy"
        ? "unknown"
        : deriveProviderStatus(operationalAlerts);
    return { key, name: meta.name, category: meta.category, status };
  });

  const activeCount = alerts.filter(
    (a) => a.status !== "resolved" && isOperationalSignal(a),
  ).length;

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-label">Provider Status</h2>
        {!isLoading && (
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            {activeCount} active incident{activeCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg bg-surface-hover"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {providerEntries.map((p) => {
            const style = PROVIDER_STATUS_STYLES[p.status];
            return (
              <Link
                key={p.key}
                href={`/status/${p.key}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                title={`${p.name} — ${style.label}. View status and incident history.`}
              >
                <span className={`status-dot ${style.dot}`} />
                <ProviderIcon providerKey={p.key} size={14} />
                <span
                  className="min-w-0 flex-1 truncate text-xs text-text-secondary"
                >
                  {p.name}
                </span>
                {activity[p.key] && (
                  <Sparkline
                    data={activity[p.key]}
                    color={PROVIDERS[p.key]?.color ?? "#8892A0"}
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Homepage rail ─────────────────────────────────────────────

const GROUP_HEADING = `${MONO} text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary`;

const ROLE_LABELS: Record<SummaryProvider["role"], string> = {
  service: "Unknown",
  advisory: "Advisory feed",
  community: "Community reports",
};

const UNAVAILABLE_REASONS: Record<SummaryProvider["dataState"], string> = {
  healthy: "",
  stale: "no successful check yet",
  error: "latest check failed",
  not_configured: "not configured",
  pending: "awaiting first check",
};

/** Problem sources first: open incidents, then stale, then unavailable. */
function attentionRank(provider: SummaryProvider): number {
  if (provider.status === "outage") return 0;
  if (provider.status === "degraded") return 1;
  return provider.coverage === "stale" ? 2 : 3;
}

function ProviderRail() {
  const { summary, nowMs, isLoading, isLastKnown } = useDashboardSummary();

  return (
    <section
      id="provider-status"
      aria-labelledby="provider-status-title"
      className="glass-card scroll-mt-28 p-4"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 id="provider-status-title" className="section-label">
          Provider status
        </h2>
        {summary && (
          <span className={`${MONO} text-[11px] text-text-muted`}>
            {plural(summary.coverage.total, "source")}
          </span>
        )}
      </div>

      {!summary ? (
        // Loading or failed: say so. A source is never assumed operational.
        <div role="status" className="space-y-2 pt-2">
          <p className="text-[13px] text-text-secondary">
            {isLoading
              ? "Checking sources…"
              : "Provider status could not be loaded. Trying again."}
          </p>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-7 animate-pulse rounded-md bg-surface-hover"
              />
            ))}
        </div>
      ) : (
        <RailGroups
          summaryProviders={summary.providers}
          nowMs={nowMs}
          trusted={!isLastKnown}
        >
          {isLastKnown && (
            <p className="mt-2 rounded-md border border-major/40 bg-major/5 px-2.5 py-1.5 text-xs text-text-primary">
              Last known provider status as of {formatUtc(summary.generatedAt)}.
            </p>
          )}
        </RailGroups>
      )}

      <Link
        href="/status"
        className={`${MONO} mt-4 inline-flex text-xs text-primary-ink underline-offset-2 hover:underline`}
      >
        Browse all provider status pages →
      </Link>
    </section>
  );
}

function RailGroups({
  summaryProviders,
  nowMs,
  trusted,
  children,
}: {
  summaryProviders: SummaryProvider[];
  nowMs: number | null;
  /** False once the snapshot is too old to describe the present. */
  trusted: boolean;
  children?: React.ReactNode;
}) {
  const attention = summaryProviders
    .filter((p) => p.coverage !== "fresh" || p.incidents > 0)
    .sort((a, b) => attentionRank(a) - attentionRank(b));
  const fresh = summaryProviders.filter(
    (p) => p.coverage === "fresh" && p.incidents === 0,
  );
  const operational = fresh.filter((p) => p.role === "service");
  const advisoryFeeds = fresh.filter((p) => p.role === "advisory");
  const communityFeeds = fresh.filter((p) => p.role === "community");

  return (
    <>
      {children}

      {(trusted || attention.length > 0) && (
        <h3 className={`${GROUP_HEADING} mt-3`}>
          {trusted ? "Needs attention" : "Needed attention at last refresh"} · {attention.length}
        </h3>
      )}
      {attention.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-text-secondary">
          {trusted
            ? "Every source is fresh and none lists an open incident."
            : "Current provider status is unavailable."}
        </p>
      ) : (
        <ul className="mt-1">
          {attention.map((provider) => (
            <AttentionRow
              key={provider.key}
              provider={provider}
              nowMs={nowMs}
              trusted={trusted}
            />
          ))}
        </ul>
      )}

      <ChipGroup
        heading={trusted ? "Operational · source fresh" : "Operational at last refresh"}
        providers={operational}
        trusted={trusted}
        describe={() => "Operational. Source fresh."}
      />
      <ChipGroup
        heading={trusted ? "Advisory feeds · fresh" : "Advisory feeds at last refresh"}
        providers={advisoryFeeds}
        trusted={trusted}
        describe={() => "Security advisory feed. Source fresh."}
      />
      <ChipGroup
        heading={trusted ? "Community reports · fresh" : "Community reports at last refresh"}
        providers={communityFeeds}
        trusted={trusted}
        describe={() => "Crowdsourced reports, not official status. Source fresh."}
      />
    </>
  );
}

function AttentionRow({
  provider,
  nowMs,
  trusted,
}: {
  provider: SummaryProvider;
  nowMs: number | null;
  /** False once the snapshot is too old: nothing is called fresh any more. */
  trusted: boolean;
}) {
  const hasIncident = provider.coverage === "fresh" && provider.incidents > 0;
  const label = hasIncident
    ? PROVIDER_STATUS_STYLES[provider.status].label
    : ROLE_LABELS[provider.role];
  const dot = hasIncident
    ? PROVIDER_STATUS_STYLES[provider.status].dot
    : provider.coverage === "stale"
      ? "status-dot-stale"
      : "status-dot-unavailable";
  const labelInk = !trusted || !hasIncident
    ? undefined
    : provider.status === "outage"
      ? "var(--ink-critical)"
      : "var(--ink-minor)";

  const details: string[] = [];
  if (hasIncident) {
    // Observed outages keep their operational status, named for what they are.
    const confirmed = provider.incidents - provider.observed;
    if (confirmed > 0) details.push(plural(confirmed, "incident"));
    if (provider.observed > 0) {
      details.push(plural(provider.observed, "observed outage"));
    }
    details.push(
      `${trusted ? "fresh · " : ""}checked ${formatAge(provider.lastSuccessAt, nowMs)}`,
    );
  } else if (provider.coverage === "stale") {
    details.push(
      `stale · last check ${formatAge(provider.lastSuccessAt, nowMs)}`,
    );
  } else {
    details.push(`unavailable · ${UNAVAILABLE_REASONS[provider.dataState]}`);
  }
  if (!hasIncident && provider.openAtLastCheck > 0) {
    details.push(`${provider.openAtLastCheck} open at last check`);
  }

  return (
    <li className="border-t border-border first:border-t-0">
      <Link
        href={`/status/${provider.key}`}
        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-1 py-1.5 transition-colors hover:bg-surface-hover"
      >
        <span className={`status-dot ${trusted ? dot : "bg-text-muted"}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[13px] font-medium text-text-primary [overflow-wrap:anywhere]">
          {providerName(provider.key)}
        </span>
        <span
          className={`${MONO} text-[11px] uppercase tracking-wide text-text-secondary`}
          style={labelInk ? { color: labelInk } : undefined}
        >
          {label}
        </span>
        <span className={`${MONO} w-full pl-[17px] text-[11px] text-text-muted`}>
          {details.join(" · ")}
        </span>
      </Link>
    </li>
  );
}

function ChipGroup({
  heading,
  providers,
  trusted,
  describe,
}: {
  heading: string;
  providers: SummaryProvider[];
  trusted: boolean;
  describe: (provider: SummaryProvider) => string;
}) {
  if (providers.length === 0) return null;
  return (
    <>
      <h3 className={`${GROUP_HEADING} mt-4`}>
        {heading} · {providers.length}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {providers.map((provider) => (
          <li key={provider.key}>
            <Link
              href={`/status/${provider.key}`}
              title={`${providerName(provider.key)} — ${
                trusted ? describe(provider) : "Status as of the last refresh."
              }`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
            >
              <span
                className={`status-dot ${trusted ? "status-dot-operational" : "bg-text-muted"}`}
                aria-hidden="true"
              />
              {providerName(provider.key)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
