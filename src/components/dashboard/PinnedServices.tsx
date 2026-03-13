"use client";

import { Pin } from "lucide-react";
import type { SerializedAlert } from "@/lib/alert-schema";
import type { AlertSeverity } from "@/lib/alert-schema";
import { PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";
import { useAlerts } from "@/hooks/useAlerts";

type ProviderStatus = "operational" | "degraded" | "outage";

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

const STATUS_CONFIG: Record<
  ProviderStatus,
  { dot: string; bg: string; label: string }
> = {
  operational: {
    dot: "status-dot-operational",
    bg: "border-secondary/20",
    label: "Operational",
  },
  degraded: {
    dot: "status-dot-degraded",
    bg: "border-minor/20",
    label: "Degraded",
  },
  outage: {
    dot: "status-dot-outage",
    bg: "border-critical/20",
    label: "Outage",
  },
};

interface PinnedServicesProps {
  pinnedServiceKeys: string[];
}

export function PinnedServices({ pinnedServiceKeys }: PinnedServicesProps) {
  const { alerts, isLoading } = useAlerts();

  if (pinnedServiceKeys.length === 0) return null;

  const alertsBySource: Record<string, SerializedAlert[]> = {};
  for (const alert of alerts) {
    if (!alertsBySource[alert.source]) alertsBySource[alert.source] = [];
    alertsBySource[alert.source].push(alert);
  }

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Pin className="h-3.5 w-3.5 text-primary" />
        <h2 className="section-label">Pinned Services</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {pinnedServiceKeys.map((key) => (
            <div
              key={key}
              className="h-16 animate-pulse rounded-lg bg-surface-hover"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {pinnedServiceKeys.map((key) => {
            const meta = PROVIDERS[key];
            if (!meta) return null;
            const status = alertsBySource[key]
              ? deriveStatus(alertsBySource[key])
              : "operational";
            const config = STATUS_CONFIG[status];
            const activeCount = (alertsBySource[key] ?? []).filter(
              (a) => a.status !== "resolved",
            ).length;

            return (
              <div
                key={key}
                className={`rounded-lg border ${config.bg} bg-surface/50 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${config.dot}`} />
                  <span className="text-sm font-medium text-text-primary">
                    {meta.name}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {config.label}
                  </span>
                  {activeCount > 0 && (
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-critical">
                      {activeCount} alert{activeCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
