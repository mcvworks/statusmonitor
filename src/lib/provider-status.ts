import type { AlertSeverity, SerializedAlert } from "./alert-schema";
import { SEVERITY_ORDER } from "./constants";

export type ProviderStatus = "operational" | "degraded" | "outage" | "unknown";

export function deriveProviderStatus(
  alerts: SerializedAlert[],
): ProviderStatus {
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

export const PROVIDER_STATUS_STYLES: Record<
  ProviderStatus,
  { dot: string; label: string }
> = {
  operational: { dot: "status-dot-operational", label: "Operational" },
  degraded: { dot: "status-dot-degraded", label: "Degraded" },
  outage: { dot: "status-dot-outage", label: "Outage" },
  unknown: { dot: "bg-text-muted", label: "Unknown" },
};
