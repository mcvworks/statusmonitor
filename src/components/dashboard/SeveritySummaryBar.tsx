"use client";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { SEVERITY_COLORS } from "@/lib/constants";
import { MONO, SEVERITIES, SEVERITY_LABELS, hasCompleteServiceCoverage, plural } from "./console-labels";

/**
 * Severity shortcuts for the alert-feed header. Each chip toggles the feed's
 * severity filter through the URL, like the filter menu does. The numbers are
 * confirmed incidents right now, taken from the server snapshot, so they do
 * not change with the feed's filters or page size.
 */
export function SeveritySummaryBar({
  activeSeverity,
  onToggle,
}: {
  activeSeverity: string;
  onToggle: (severity: string) => void;
}) {
  const { summary, isLastKnown } = useDashboardSummary();
  const counts = !isLastKnown ? summary?.incidents.bySeverity : undefined;
  const canShowZero = !!summary && hasCompleteServiceCoverage(summary);
  const hasCurrentCounts = !!counts && (canShowZero || Object.values(counts).some((count) => count > 0));

  return (
    <div
      role="group"
      aria-label="Filter the feed by severity"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className={`${MONO} mr-1 text-[10px] uppercase tracking-[0.1em] text-text-muted`}>
        {hasCurrentCounts ? "Confirmed now" : "Severity"}
      </span>
      {SEVERITIES.map((severity) => {
        const verified = counts?.[severity];
        const count = verified !== undefined && (verified > 0 || canShowZero) ? verified : null;
        const pressed = activeSeverity === severity;
        return (
          <button
            key={severity}
            type="button"
            aria-pressed={pressed}
            aria-label={
              count === null
                ? `${SEVERITY_LABELS[severity]}: confirmed count unavailable. Filter the feed.`
                : `${SEVERITY_LABELS[severity]}: ${plural(count, "confirmed incident")} now. Filter the feed.`
            }
            onClick={() => onToggle(severity)}
            className={`${MONO} inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              pressed
                ? "border-primary bg-primary/10 text-primary-ink"
                : count === 0
                  ? "border-border text-text-muted hover:border-border-hover hover:text-text-secondary"
                  : "border-border text-text-secondary hover:border-border-hover hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                count === 0 && !pressed ? "opacity-40" : ""
              }`}
              style={{ backgroundColor: SEVERITY_COLORS[severity].fg }}
              aria-hidden="true"
            />
            {SEVERITY_LABELS[severity]}
            <span className={count ? "font-semibold text-text-primary" : ""}>
              {count ?? "–"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
