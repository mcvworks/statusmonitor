"use client";

import { useAlerts } from "@/hooks/useAlerts";
import type { SerializedAlertWithState } from "@/lib/alert-schema";

type BannerState = "clear" | "degraded" | "critical";

function deriveBannerState(alerts: SerializedAlertWithState[]): {
  state: BannerState;
  activeAlerts: SerializedAlertWithState[];
  bySeverity: Record<string, number>;
  affectedProviders: string[];
} {
  const activeAlerts = alerts.filter(
    (a) => a.status !== "resolved",
  );
  const bySeverity: Record<string, number> = {};
  const providerSet = new Set<string>();

  for (const a of activeAlerts) {
    bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1;
    providerSet.add(a.source);
  }

  const affectedProviders = Array.from(providerSet);
  let state: BannerState = "clear";

  if (activeAlerts.length > 0) {
    state = bySeverity["critical"] ? "critical" : "degraded";
  }

  return { state, activeAlerts, bySeverity, affectedProviders };
}

const PROVIDER_COUNT = 22;

export function HealthBanner() {
  const { alerts, isLoading } = useAlerts();

  if (isLoading) return null;

  const { state, activeAlerts, bySeverity, affectedProviders } =
    deriveBannerState(alerts);

  const handleClick = () => {
    if (state === "clear") return;
    document
      .getElementById("alert-feed")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      role={state !== "clear" ? "button" : undefined}
      tabIndex={state !== "clear" ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={`glass-card relative overflow-hidden rounded-2xl px-5 py-4 transition-all ${
        state !== "clear" ? "cursor-pointer hover:-translate-y-0.5" : ""
      } ${state === "critical" ? "health-banner-pulse" : ""}`}
    >
      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow:
            state === "clear"
              ? "inset 0 0 30px rgba(72, 224, 199, 0.06), 0 0 20px rgba(72, 224, 199, 0.04)"
              : state === "degraded"
                ? "inset 0 0 30px rgba(242, 194, 0, 0.08), 0 0 20px rgba(242, 194, 0, 0.06)"
                : "inset 0 0 30px rgba(255, 107, 107, 0.1), 0 0 20px rgba(255, 107, 107, 0.08)",
        }}
      />

      {/* Status dot + text */}
      <div className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
            state === "clear"
              ? "bg-secondary shadow-[0_0_8px_rgba(72,224,199,0.5)]"
              : state === "degraded"
                ? "bg-minor shadow-[0_0_8px_rgba(242,194,0,0.5)]"
                : "bg-critical shadow-[0_0_8px_rgba(255,107,107,0.5)]"
          }`}
        />

        <div className="text-center sm:text-left">
          {state === "clear" ? (
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-secondary">
              All systems operational — {PROVIDER_COUNT}/{PROVIDER_COUNT}{" "}
              providers clear
            </p>
          ) : state === "degraded" ? (
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-minor">
              {activeAlerts.length} incident{activeAlerts.length !== 1 ? "s" : ""}{" "}
              across {affectedProviders.length} provider
              {affectedProviders.length !== 1 ? "s" : ""}
              <span className="ml-2 text-xs text-text-muted">
                {Object.entries(bySeverity)
                  .map(([sev, count]) => `${count} ${sev}`)
                  .join(" · ")}
              </span>
            </p>
          ) : (
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-critical">
              {bySeverity["critical"]} critical incident
              {bySeverity["critical"] !== 1 ? "s" : ""} —{" "}
              {affectedProviders.length} provider
              {affectedProviders.length !== 1 ? "s" : ""} affected
              <span className="ml-2 text-xs text-text-muted">
                {affectedProviders.slice(0, 5).join(", ")}
                {affectedProviders.length > 5
                  ? ` +${affectedProviders.length - 5} more`
                  : ""}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
