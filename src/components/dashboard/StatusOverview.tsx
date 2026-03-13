"use client";

import type { SerializedAlert } from "@/lib/alert-schema";
import { PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import { useAlerts } from "@/hooks/useAlerts";

type ProviderStatus = "operational" | "degraded" | "outage" | "unknown";

function deriveStatus(alerts: SerializedAlert[]): ProviderStatus {
  const active = alerts.filter((a) => a.status !== "resolved");
  if (active.length === 0) return "operational";

  const worst = active.reduce<AlertSeverity>(
    (acc, a) =>
      SEVERITY_ORDER[a.severity as AlertSeverity] < SEVERITY_ORDER[acc]
        ? (a.severity as AlertSeverity)
        : acc,
    "info",
  );

  if (worst === "critical" || worst === "major") return "outage";
  return "degraded";
}

const STATUS_STYLES: Record<
  ProviderStatus,
  { dot: string; label: string }
> = {
  operational: { dot: "status-dot-operational", label: "Operational" },
  degraded: { dot: "status-dot-degraded", label: "Degraded" },
  outage: { dot: "status-dot-outage", label: "Outage" },
  unknown: { dot: "bg-text-muted", label: "Unknown" },
};

interface StatusOverviewProps {
  sourceFilter?: string[];
}

export function StatusOverview({ sourceFilter }: StatusOverviewProps = {}) {
  const { alerts, isLoading } = useAlerts();

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
    const status = alertsBySource[key]
      ? deriveStatus(alertsBySource[key])
      : "operational";
    return { key, name: meta.name, category: meta.category, status };
  });

  const activeCount = alerts.filter((a) => a.status !== "resolved").length;

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
            const style = STATUS_STYLES[p.status];
            return (
              <div
                key={p.key}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className={`status-dot ${style.dot}`} />
                <span className="truncate text-xs text-text-secondary">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
