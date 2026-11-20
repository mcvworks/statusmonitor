"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { SEVERITY_COLORS } from "@/lib/constants";
import { MONO, SEVERITIES, SEVERITY_LABELS, plural } from "./console-labels";

/**
 * Severity shortcuts for the alert-feed header. Each chip toggles the feed's
 * severity filter through the URL, like the filter menu does. The numbers are
 * confirmed incidents right now, taken from the server snapshot, so they do
 * not change with the feed's filters or page size.
 */
export function SeveritySummaryBar() {
  const { summary, isLastKnown } = useDashboardSummary();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSeverity = searchParams.get("severity") ?? "";
  const hasFreshService = summary?.providers.some(
    (provider) => provider.role === "service" && provider.coverage === "fresh",
  );
  const counts = !isLastKnown && hasFreshService
    ? summary?.incidents.bySeverity ?? null
    : null;

  const toggle = (severity: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeSeverity === severity) {
      params.delete("severity");
    } else {
      params.set("severity", severity);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  return (
    <div
      role="group"
      aria-label="Filter the feed by severity"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className={`${MONO} mr-1 text-[10px] uppercase tracking-[0.1em] text-text-muted`}>
        {counts ? "Confirmed now" : "Severity"}
      </span>
      {SEVERITIES.map((severity) => {
        const count = counts ? counts[severity] : null;
        const pressed = activeSeverity === severity;
        return (
          <button
            key={severity}
            type="button"
            aria-pressed={pressed}
            aria-label={
              count === null
                ? `${SEVERITY_LABELS[severity]}: filter the feed`
                : `${SEVERITY_LABELS[severity]}: ${plural(count, "confirmed incident")} now. Filter the feed.`
            }
            onClick={() => toggle(severity)}
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
