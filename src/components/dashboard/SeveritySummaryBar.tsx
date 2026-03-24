"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAlerts } from "@/hooks/useAlerts";
import { SEVERITY_COLORS, SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";

const SEVERITIES = (
  Object.keys(SEVERITY_ORDER) as AlertSeverity[]
).sort((a, b) => SEVERITY_ORDER[a] - SEVERITY_ORDER[b]);

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Info",
};

const MIN_SEGMENT_PCT = 4;

export function SeveritySummaryBar() {
  const { alerts, isLoading } = useAlerts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSeverity = searchParams.get("severity") ?? "";

  const active = alerts.filter((a) => a.status !== "resolved");

  // Count by severity
  const counts: Record<AlertSeverity, number> = {
    critical: 0,
    major: 0,
    minor: 0,
    info: 0,
  };
  for (const a of active) {
    const sev = a.severity as AlertSeverity;
    if (sev in counts) counts[sev]++;
  }

  const total = active.length;

  const handleSegmentClick = (severity: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeSeverity === severity) {
      params.delete("severity");
    } else {
      params.set("severity", severity);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-label">Severity Distribution</h2>
        </div>
        <div className="h-3 animate-pulse rounded-full bg-surface-hover" />
      </div>
    );
  }

  // Empty state
  if (total === 0) {
    return (
      <div className="glass-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-label">Severity Distribution</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-border" />
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            No active incidents
          </span>
        </div>
      </div>
    );
  }

  // Calculate segment widths with minimum
  const present = SEVERITIES.filter((s) => counts[s] > 0);
  const rawPcts = present.map((s) => (counts[s] / total) * 100);
  // Apply minimum width; redistribute excess proportionally
  const adjusted = rawPcts.map((p) => Math.max(p, MIN_SEGMENT_PCT));
  const adjustedTotal = adjusted.reduce((a, b) => a + b, 0);
  const widths = adjusted.map((p) => (p / adjustedTotal) * 100);

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-label">Severity Distribution</h2>
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          {total} active
        </span>
      </div>

      {/* Labels */}
      <div className="mb-1.5 flex gap-4">
        {SEVERITIES.map((sev) => (
          <button
            key={sev}
            onClick={() => handleSegmentClick(sev)}
            className={`flex items-center gap-1.5 transition-opacity ${
              counts[sev] === 0
                ? "pointer-events-none opacity-30"
                : activeSeverity === sev
                  ? "opacity-100"
                  : "opacity-70 hover:opacity-100"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[sev].fg }}
            />
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-secondary">
              {counts[sev]} {SEVERITY_LABELS[sev]}
            </span>
          </button>
        ))}
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-input">
        {present.map((sev, i) => (
          <button
            key={sev}
            onClick={() => handleSegmentClick(sev)}
            className={`relative h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full ${
              activeSeverity && activeSeverity !== sev
                ? "opacity-40"
                : "opacity-100"
            }`}
            style={{
              width: `${widths[i]}%`,
              backgroundColor: SEVERITY_COLORS[sev].fg,
            }}
            title={`${SEVERITY_LABELS[sev]}: ${counts[sev]} incident${counts[sev] !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
