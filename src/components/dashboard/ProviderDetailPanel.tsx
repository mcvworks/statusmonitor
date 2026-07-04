"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, History, Users, X } from "lucide-react";
import { PROVIDERS, CATEGORY_LABELS } from "@/lib/constants";
import {
  deriveProviderStatus,
  PROVIDER_STATUS_STYLES,
} from "@/lib/provider-status";
import { useAlerts } from "@/hooks/useAlerts";
import { useActivity } from "@/hooks/useActivity";
import { ProviderIcon } from "./ProviderIcon";
import { Sparkline } from "./Sparkline";

function formatResolutionTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

interface ProviderDetailPanelProps {
  source: string;
}

export function ProviderDetailPanel({ source }: ProviderDetailPanelProps) {
  const meta = PROVIDERS[source];
  const router = useRouter();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);

  const { alerts, isLoading, avgResolutionBySource } = useAlerts({ source });
  const { activity } = useActivity();

  // Bring the panel into view when a provider is selected from the sidebar
  // (which may happen while scrolled elsewhere on the page)
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [source]);

  if (!meta) return null;

  const status = isLoading ? "unknown" : deriveProviderStatus(alerts);
  const style = PROVIDER_STATUS_STYLES[status];
  const activeCount = alerts.filter((a) => a.status !== "resolved").length;
  const weekActivity = activity[source] ?? [];
  const weekCount = weekActivity.reduce((sum, n) => sum + n, 0);
  const avgResolution = avgResolutionBySource[source];

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("source");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  return (
    <div ref={panelRef} className="glass-card corner-brackets p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProviderIcon providerKey={source} size={28} />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-text-primary">
                {meta.name}
              </h2>
              <span className="rounded-md border border-border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
                {CATEGORY_LABELS[meta.category]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`status-dot ${style.dot}`} />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-secondary">
                {style.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearFilter}
          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          title="Clear provider filter"
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">All providers</span>
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Active incidents"
          value={isLoading ? "—" : String(activeCount)}
          accent={activeCount > 0}
        />
        <StatTile
          label="Alerts (7 days)"
          value={isLoading ? "—" : String(weekCount)}
        />
        <StatTile
          label="Avg resolution"
          value={avgResolution ? formatResolutionTime(avgResolution) : "—"}
        />
        <div className="flex flex-col justify-between rounded-lg border border-border bg-surface-input px-3 py-2">
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
            7-day activity
          </span>
          {weekActivity.length > 0 && weekCount > 0 ? (
            <Sparkline data={weekActivity} color={meta.color} />
          ) : (
            <span className="text-xs text-text-muted">Quiet</span>
          )}
        </div>
      </div>

      {/* External links */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PanelLink href={meta.statusUrl} icon={<ExternalLink className="h-3 w-3" />}>
          Official status page
        </PanelLink>
        {meta.historyUrl && meta.historyUrl !== meta.statusUrl && (
          <PanelLink href={meta.historyUrl} icon={<History className="h-3 w-3" />}>
            Incident history
          </PanelLink>
        )}
        {meta.downdetectorSlug && (
          <PanelLink
            href={`https://downdetector.com/status/${meta.downdetectorSlug}/`}
            icon={<Users className="h-3 w-3" />}
          >
            User reports
          </PanelLink>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-surface-input px-3 py-2">
      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={`font-[family-name:var(--font-mono)] text-lg font-semibold ${
          accent ? "text-critical" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PanelLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:border-primary/30 hover:bg-[rgba(242,194,0,0.06)] hover:text-primary"
    >
      {icon}
      {children}
    </a>
  );
}
