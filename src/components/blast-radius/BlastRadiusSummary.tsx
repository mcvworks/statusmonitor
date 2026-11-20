"use client";

import { Zap } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useDependencyMap } from "@/hooks/useDependencies";
import { DEPENDENCY_MAP } from "@/lib/dependencies/static-map";
import { isOperationalSignal } from "@/lib/signal-kind";

interface BlastRadiusSummaryProps {
  /**
   * Providers known to have a current incident (the homepage passes its
   * server snapshot). Null means "not known yet": nothing is shown. When the
   * prop is left out, they are derived from the latest alerts instead.
   */
  providers?: string[] | null;
}

export function BlastRadiusSummary({ providers }: BlastRadiusSummaryProps = {}) {
  return providers === undefined ? (
    <BlastRadiusFromAlerts />
  ) : (
    <BlastRadiusNotice providers={providers ?? []} />
  );
}

function BlastRadiusFromAlerts() {
  const { alerts } = useAlerts();

  // Find major providers with active incidents
  const activeProviders = alerts
    .filter((a) => a.status !== "resolved" && isOperationalSignal(a))
    .map((a) => a.source);

  return <BlastRadiusNotice providers={activeProviders} />;
}

function BlastRadiusNotice({ providers }: { providers: string[] }) {
  const { isLoading } = useDependencyMap();

  // Unique providers with active incidents that have a dependency map
  const blastRadiusProviders = new Set(DEPENDENCY_MAP.map((m) => m.provider));
  const affectedProviders = new Set(
    providers.filter((provider) => blastRadiusProviders.has(provider)),
  );
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
