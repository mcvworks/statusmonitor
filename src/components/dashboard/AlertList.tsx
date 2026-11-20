"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Inbox } from "lucide-react";
import type { AlertCategory, AlertSeverity, SerializedAlertWithState } from "@/lib/alert-schema";
import { MAX_ALERT_AGE_DAYS, PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";
import { useAlerts } from "@/hooks/useAlerts";
import { CategoryGroup } from "./CategoryGroup";
import { useLocalAlertStates } from "@/hooks/useAlertActions";

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
  source?: string;
  sort?: string;
  sourceFilter?: string[];
  scope?: "all" | "operations" | "security";
  /** Show how many of the matching alerts are listed. */
  showCount?: boolean;
}

export function AlertList({
  category,
  severity,
  status,
  search,
  source,
  sort,
  sourceFilter,
  scope,
  showCount = false,
}: AlertListProps = {}) {
  // source and search are filtered server-side — filtering the 50-alert
  // window client-side made matches outside that window invisible
  const { alerts, total, isLoading, isError, avgResolutionBySource } = useAlerts({
    category,
    severity,
    status,
    source,
    q: search,
    scope,
  });
  const { states } = useLocalAlertStates();
  const [showDismissed, setShowDismissed] = useState(false);

  // Client-side filtering: text search + source filter + alert states
  const { visible, hiddenCount } = useMemo(() => {
    let result = alerts;

    if (!source && sourceFilter && sourceFilter.length > 0) {
      const allowed = new Set(sourceFilter);
      result = result.filter((a) => allowed.has(a.source));
    }

    // Apply sorting
    if (sort === "severity") {
      result = [...result].sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity as AlertSeverity] ?? 3) -
          (SEVERITY_ORDER[b.severity as AlertSeverity] ?? 3),
      );
    } else if (sort === "provider") {
      result = [...result].sort((a, b) => a.source.localeCompare(b.source));
    }
    // "newest" is the default API order, no re-sort needed

    // Filter out snoozed/dismissed alerts stored in this browser.
    if (Object.keys(states).length > 0) {
      let hidden = 0;
      const filtered = result.filter((a) => {
        const userState = states[a.id] ?? a.userState;
        if (!userState) return true;

        // Snoozed: hide if snooze hasn't expired
        if (
          userState.state === "snoozed" &&
          !isSnoozeExpired(userState.snoozedUntil)
        ) {
          hidden++;
          return showDismissed;
        }

        // Dismissed: hide unless alert status changed (resolved → reactivated)
        if (userState.state === "dismissed") {
          hidden++;
          return showDismissed;
        }

        return true;
      });
      return { visible: filtered, hiddenCount: hidden };
    }

    return { visible: result, hiddenCount: 0 };
  }, [alerts, source, sourceFilter, sort, states, showDismissed]);

  if (isLoading) {
    return (
      <div role="status" className="glass-card flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-[family-name:var(--font-mono)] text-sm">
            Loading alerts...
          </span>
        </div>
      </div>
    );
  }

  // A failed request says nothing about the services, so it is never
  // rendered as an empty (and reassuring) list.
  if (isError && alerts.length === 0) {
    return (
      <div role="alert" className="glass-card flex items-center justify-center p-12 text-critical-ink">
        <p className="font-[family-name:var(--font-mono)] text-sm">
          Failed to load alerts. Retrying...
        </p>
      </div>
    );
  }

  const hasFilters = !!(search || source || category || severity || status);

  if (visible.length === 0 && hiddenCount === 0) {
    const providerName = source
      ? (PROVIDERS[source]?.name ?? source)
      : undefined;
    const hasOtherFilters = !!(search || category || severity || status);
    // A saved view limits the latest alerts to its own services.
    const limitedToView = !source && !!sourceFilter && sourceFilter.length > 0;
    // This describes the feed only. Whether services are healthy is the
    // summary's job, which also knows which sources could not be checked.
    return (
      <div role="status" className="glass-card corner-brackets flex flex-col items-center justify-center p-12 text-center">
        <Inbox className="mb-3 h-8 w-8 text-text-muted" aria-hidden="true" />
        <p className="text-lg font-medium text-text-primary">
          {providerName
            ? `No recent alerts from ${providerName}`
            : hasOtherFilters
              ? "No matching alerts"
              : limitedToView
                ? "No alerts from the services in this view"
                : "No alerts in the feed"}
        </p>
        <p className="mt-1 max-w-md text-sm text-text-secondary">
          {hasOtherFilters
            ? "Nothing matches your search or filters. Clear them to see the full feed."
            : providerName
              ? `Nothing from ${providerName} in the retained history (${MAX_ALERT_AGE_DAYS} days).`
              : limitedToView
                ? "None of the latest alerts come from the services in this view. An empty list on its own is not an all-clear."
                : "The monitored sources have reported nothing in the retained history. An empty feed on its own is not an all-clear."}
        </p>
      </div>
    );
  }

  const grouped = groupByCategory(visible);

  return (
    <div className="space-y-6">
      {showCount && (
        <p
          role="status"
          className="mb-2 px-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted"
        >
          Showing {visible.length.toLocaleString("en-US")}
          {total > visible.length && ` of ${total.toLocaleString("en-US")}`}{" "}
          {hasFilters ? "matching " : ""}alert{total === 1 ? "" : "s"}
          {isError && " · refresh failed, retrying"}
          {total > visible.length && (
            <>
              {" · "}
              <Link
                href="/history"
                className="text-primary-ink underline-offset-2 hover:underline"
              >
                browse the full history
              </Link>
            </>
          )}
        </p>
      )}

      {CATEGORY_ORDER.map((cat) =>
        grouped[cat] ? (
          <CategoryGroup
            key={cat}
            category={cat}
            alerts={grouped[cat]}
            avgResolutionBySource={avgResolutionBySource}
          />
        ) : null,
      )}

      {/* Hidden alerts banner */}
      {hiddenCount > 0 && (
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
