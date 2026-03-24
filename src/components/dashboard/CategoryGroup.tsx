"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AlertCategory, SerializedAlertWithState } from "@/lib/alert-schema";
import { CATEGORY_LABELS } from "@/lib/constants";
import { PROVIDERS } from "@/lib/constants";
import { AlertCard } from "./AlertCard";
import { ProviderIcon } from "./ProviderIcon";

interface CategoryGroupProps {
  category: AlertCategory;
  alerts: SerializedAlertWithState[];
  avgResolutionBySource: Record<string, number>;
}

interface SourceCluster {
  source: string;
  name: string;
  alerts: SerializedAlertWithState[];
}

function clusterBySource(alerts: SerializedAlertWithState[]): SourceCluster[] {
  const map = new Map<string, SerializedAlertWithState[]>();
  for (const alert of alerts) {
    const existing = map.get(alert.source);
    if (existing) {
      existing.push(alert);
    } else {
      map.set(alert.source, [alert]);
    }
  }

  return Array.from(map.entries()).map(([source, sourceAlerts]) => ({
    source,
    name: PROVIDERS[source]?.name ?? source,
    alerts: sourceAlerts,
  }));
}

function SourceGroup({
  cluster,
  avgResolutionMin,
}: {
  cluster: SourceCluster;
  avgResolutionMin?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Single alert from a source — render directly, no cluster header
  if (cluster.alerts.length === 1) {
    return (
      <AlertCard
        alert={cluster.alerts[0]}
        avgResolutionMin={avgResolutionMin}
      />
    );
  }

  // Multiple alerts from same source — show collapsible cluster
  const activeCount = cluster.alerts.filter(
    (a) => a.status !== "resolved",
  ).length;

  return (
    <div className="rounded-xl border border-border/50 bg-card-solid/30">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover/50"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
        )}
        <ProviderIcon providerKey={cluster.source} size={14} />
        <span className="text-xs font-medium text-text-primary">
          {cluster.name}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          {cluster.alerts.length} incident{cluster.alerts.length !== 1 ? "s" : ""}
          {activeCount > 0 && activeCount < cluster.alerts.length && (
            <> &middot; {activeCount} active</>
          )}
        </span>
        {avgResolutionMin != null && activeCount > 0 && (
          <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
            typically resolves in ~{formatDuration(avgResolutionMin)}
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="space-y-3 px-3 pb-3">
          {cluster.alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              avgResolutionMin={avgResolutionMin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function CategoryGroup({
  category,
  alerts,
  avgResolutionBySource,
}: CategoryGroupProps) {
  if (alerts.length === 0) return null;

  const clusters = clusterBySource(alerts);

  return (
    <div>
      <div className="section-label mb-3">
        {CATEGORY_LABELS[category]}
        <span className="ml-1 text-text-muted">({alerts.length})</span>
      </div>
      <div className="space-y-3">
        {clusters.map((cluster) => (
          <SourceGroup
            key={cluster.source}
            cluster={cluster}
            avgResolutionMin={avgResolutionBySource[cluster.source]}
          />
        ))}
      </div>
    </div>
  );
}
