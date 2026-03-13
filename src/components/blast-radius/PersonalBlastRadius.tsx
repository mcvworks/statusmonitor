"use client";

import { useMemo } from "react";
import { Zap, ShieldAlert, CheckCircle } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useStack, type StackEntry } from "@/hooks/useStack";
import { PROVIDERS } from "@/lib/constants";
import { DEPENDENCY_MAP } from "@/lib/dependencies/static-map";

interface AffectedStackEntry extends StackEntry {
  reason: "direct" | "downstream";
  alertTitle?: string;
}

export function PersonalBlastRadius() {
  const { alerts } = useAlerts();
  const { stack, isLoading } = useStack();

  const analysis = useMemo(() => {
    if (stack.length === 0) return null;

    // Active (non-resolved) alerts
    const activeAlerts = alerts.filter((a) => a.status !== "resolved");
    const activeProviders = new Set(activeAlerts.map((a) => a.source));

    const affected: AffectedStackEntry[] = [];
    const seen = new Set<string>();

    for (const entry of stack) {
      // Direct hit: the provider itself has an alert
      if (activeProviders.has(entry.provider)) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id);
          const alert = activeAlerts.find((a) => a.source === entry.provider);
          affected.push({
            ...entry,
            reason: "direct",
            alertTitle: alert?.title,
          });
        }
      }

      // Downstream: provider depends on an affected major provider
      for (const depMap of DEPENDENCY_MAP) {
        if (!activeProviders.has(depMap.provider)) continue;
        // Check if this entry's provider name matches a dependent service
        const providerName = PROVIDERS[entry.provider]?.name ?? entry.provider;
        const isDependent = depMap.services.some(
          (s) =>
            s.service.toLowerCase() === providerName.toLowerCase() ||
            s.service.toLowerCase() === entry.serviceName.toLowerCase()
        );
        if (isDependent && !seen.has(entry.id)) {
          seen.add(entry.id);
          const alert = activeAlerts.find(
            (a) => a.source === depMap.provider
          );
          affected.push({
            ...entry,
            reason: "downstream",
            alertTitle: alert?.title,
          });
        }
      }
    }

    return {
      total: stack.length,
      affected,
      affectedCount: affected.length,
      safe: stack.length - affected.length,
    };
  }, [stack, alerts]);

  if (isLoading || !analysis) return null;

  const { total, affected, affectedCount, safe } = analysis;

  if (affectedCount === 0) {
    return (
      <div className="glass-card flex items-center gap-3 border-secondary/20 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
          <CheckCircle className="h-4 w-4 text-secondary" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-primary">
            All {total} services in your stack are unaffected
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            No active incidents affecting your infrastructure
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card space-y-3 border-error/20 p-4">
      {/* Summary banner */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error/10">
          <ShieldAlert className="h-4 w-4 text-error" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-primary">
            {affectedCount} of your {total} service
            {total !== 1 ? "s" : ""} affected by current incidents
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            {safe} service{safe !== 1 ? "s" : ""} operating normally
          </p>
        </div>
      </div>

      {/* Affected services list */}
      <div className="space-y-1">
        {affected.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 rounded-lg bg-error/5 px-3 py-2"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-error" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">
                {entry.serviceName}
                <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
                  ({PROVIDERS[entry.provider]?.name ?? entry.provider})
                </span>
              </p>
              {entry.alertTitle && (
                <p className="truncate font-[family-name:var(--font-mono)] text-[11px] text-error/80">
                  {entry.reason === "direct" ? "Direct" : "Downstream"} —{" "}
                  {entry.alertTitle}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                entry.reason === "direct"
                  ? "bg-error/10 text-error"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {entry.reason === "direct" ? "DIRECT" : "DOWNSTREAM"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
