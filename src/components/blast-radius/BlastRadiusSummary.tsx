"use client";

import { Zap } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useDependencyMap } from "@/hooks/useDependencies";
import { DEPENDENCY_MAP } from "@/lib/dependencies/static-map";

export function BlastRadiusSummary() {
  const { alerts } = useAlerts();
  const { isLoading } = useDependencyMap();

  // Find major providers with active incidents
  const blastRadiusProviders = new Set(DEPENDENCY_MAP.map((m) => m.provider));
  const activeProviderAlerts = alerts.filter(
    (a) => a.status !== "resolved" && blastRadiusProviders.has(a.source),
  );

  // Unique providers with active incidents
  const affectedProviders = new Set(activeProviderAlerts.map((a) => a.source));
  const providerCount = affectedProviders.size;

  if (providerCount === 0 || isLoading) return null;

  // Count total potentially affected services
  const affectedServiceCount = DEPENDENCY_MAP
    .filter((m) => affectedProviders.has(m.provider))
    .reduce((sum, m) => sum + m.services.length, 0);

  return (
    <div className="glass-card flex items-center gap-3 border-primary/20 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-text-primary">
          {providerCount} major provider{providerCount !== 1 ? "s" : ""} with active incidents
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          ~{affectedServiceCount} downstream service{affectedServiceCount !== 1 ? "s" : ""} potentially affected
        </p>
      </div>
    </div>
  );
}
