"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import type { AlertCategory, SerializedAlertWithState } from "@/lib/alert-schema";
import { useAlerts } from "@/hooks/useAlerts";
import { CategoryGroup } from "./CategoryGroup";

const CATEGORY_ORDER: AlertCategory[] = [
  "cloud",
  "devops",
  "security",
  "isp",
];

function groupByCategory(alerts: SerializedAlertWithState[]) {
  const groups: Record<string, SerializedAlertWithState[]> = {};
  for (const alert of alerts) {
    const cat = alert.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(alert);
  }
  return groups;
}

function isSnoozeExpired(snoozedUntil: string | null): boolean {
  if (!snoozedUntil) return true;
  return new Date(snoozedUntil) <= new Date();
}

interface AlertListProps {
  category?: string;
  severity?: string;
  status?: string;
  search?: string;
  sourceFilter?: string[];
}

export function AlertList({
  category,
  severity,
  status,
  search,
  sourceFilter,
}: AlertListProps = {}) {
  const { alerts, isLoading, isError } = useAlerts({
    category,
    severity,
    status,
  });
  const { data: session } = useSession();
  const [showDismissed, setShowDismissed] = useState(false);

  // Client-side filtering: text search + source filter + alert states
  const { visible, hiddenCount } = useMemo(() => {
    let result = alerts;

    if (sourceFilter && sourceFilter.length > 0) {
      const allowed = new Set(sourceFilter);
      result = result.filter((a) => allowed.has(a.source));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)),
      );
    }

    // Filter out snoozed/dismissed alerts for authenticated users
    if (session?.user) {
      let hidden = 0;
      const filtered = result.filter((a) => {
        if (!a.userState) return true;

        // Snoozed: hide if snooze hasn't expired
        if (
          a.userState.state === "snoozed" &&
          !isSnoozeExpired(a.userState.snoozedUntil)
        ) {
          hidden++;
          return showDismissed;
        }

        // Dismissed: hide unless alert status changed (resolved → reactivated)
        if (a.userState.state === "dismissed") {
          hidden++;
          return showDismissed;
        }

        return true;
      });
      return { visible: filtered, hiddenCount: hidden };
    }

    return { visible: result, hiddenCount: 0 };
  }, [alerts, search, sourceFilter, session?.user, showDismissed]);

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

  if (visible.length === 0 && hiddenCount === 0) {
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

  const grouped = groupByCategory(visible);

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

      {/* Hidden alerts banner */}
      {session?.user && hiddenCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card-solid/50 px-4 py-2.5">
          <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
            {hiddenCount} alert{hiddenCount !== 1 ? "s" : ""}{" "}
            {showDismissed ? "shown" : "hidden"} (snoozed/dismissed)
          </span>
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {showDismissed ? (
              <>
                <EyeOff className="h-3 w-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Show
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
