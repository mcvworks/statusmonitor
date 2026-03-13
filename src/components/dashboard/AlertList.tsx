"use client";

import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import type { AlertCategory, SerializedAlert } from "@/lib/alert-schema";
import { useAlerts } from "@/hooks/useAlerts";
import { CategoryGroup } from "./CategoryGroup";

const CATEGORY_ORDER: AlertCategory[] = [
  "cloud",
  "devops",
  "security",
  "isp",
];

function groupByCategory(alerts: SerializedAlert[]) {
  const groups: Record<string, SerializedAlert[]> = {};
  for (const alert of alerts) {
    const cat = alert.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(alert);
  }
  return groups;
}

interface AlertListProps {
  category?: string;
  severity?: string;
  status?: string;
  search?: string;
}

export function AlertList({
  category,
  severity,
  status,
  search,
}: AlertListProps = {}) {
  const { alerts, isLoading, isError } = useAlerts({
    category,
    severity,
    status,
  });

  // Client-side text search for instant filtering
  const filtered = useMemo(() => {
    if (!search) return alerts;
    const q = search.toLowerCase();
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)),
    );
  }, [alerts, search]);

  if (isLoading) {
    return (
      <div className="glass-card flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-[family-name:var(--font-mono)] text-sm">
            Loading alerts...
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card flex items-center justify-center p-12 text-critical">
        <p className="font-[family-name:var(--font-mono)] text-sm">
          Failed to load alerts. Retrying...
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="glass-card corner-brackets flex flex-col items-center justify-center p-12">
        <CheckCircle className="mb-3 h-8 w-8 text-secondary" />
        <p className="text-lg font-medium text-text-primary">
          {search || category || severity || status
            ? "No Matching Alerts"
            : "All Systems Operational"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {search || category || severity || status
            ? "Try adjusting your search or filters."
            : "No active incidents detected across all monitored services."}
        </p>
      </div>
    );
  }

  const grouped = groupByCategory(filtered);

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) =>
        grouped[cat] ? (
          <CategoryGroup
            key={cat}
            category={cat}
            alerts={grouped[cat]}
          />
        ) : null,
      )}
    </div>
  );
}
