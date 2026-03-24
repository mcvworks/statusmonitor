"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Clock,
  X,
  Undo2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { SerializedAlertWithState } from "@/lib/alert-schema";
import { formatRelativeTime, truncate, ensureReadable } from "@/lib/utils";
import { PROVIDERS, SEVERITY_COLORS } from "@/lib/constants";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import { SeverityBadge } from "./SeverityBadge";
import { ProviderIcon } from "./ProviderIcon";
import {
  BlastRadiusPanel,
  hasBlastRadius,
} from "@/components/blast-radius/BlastRadiusPanel";
import { useAlertActions } from "@/hooks/useAlertActions";
import { IncidentTimeline } from "./IncidentTimeline";
import { CvssBreakdown } from "./CvssBreakdown";
import { ComponentChips } from "./ComponentChips";

const SNOOZE_OPTIONS = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "1 hr", ms: 60 * 60 * 1000 },
  { label: "4 hr", ms: 4 * 60 * 60 * 1000 },
  { label: "24 hr", ms: 24 * 60 * 60 * 1000 },
];

interface AlertCardProps {
  alert: SerializedAlertWithState;
  showActions?: boolean;
  avgResolutionMin?: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SeverityTrend({
  current,
  previous,
}: {
  current: string;
  previous: string | null;
}) {
  if (!previous || previous === current) return null;

  const currentRank = SEVERITY_ORDER[current as AlertSeverity] ?? 3;
  const prevRank = SEVERITY_ORDER[previous as AlertSeverity] ?? 3;
  const escalating = currentRank < prevRank; // lower rank = higher severity

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] ${
        escalating
          ? "bg-critical/10 text-critical"
          : "bg-secondary/10 text-secondary"
      }`}
      title={`${escalating ? "Escalated" : "De-escalated"} from ${previous}`}
    >
      {escalating ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {escalating ? "Escalated" : "De-escalated"}
    </span>
  );
}

export function AlertCard({ alert, showActions = true, avgResolutionMin }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const { data: session } = useSession();
  const { acknowledge, snooze, dismiss, clear } = useAlertActions();

  const isResolved = alert.status === "resolved";
  const provider = PROVIDERS[alert.source];
  const providerName = provider?.name ?? alert.source;
  const isAuthenticated = !!session?.user;
  const userState = alert.userState;
  const isAcknowledged = userState?.state === "acknowledged";
  const severityColor = SEVERITY_COLORS[alert.severity as AlertSeverity];
  const readableProviderColor = provider?.color
    ? ensureReadable(provider.color)
    : undefined;
  const metadata = alert.metadata as Record<string, unknown> | null;

  const handleSnooze = async (ms: number) => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is in an event handler, not during render
    const until = new Date(Date.now() + ms).toISOString();
    await snooze(alert.id, until);
    setSnoozeOpen(false);
  };

  return (
    <div
      className={`glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isResolved ? "opacity-50" : ""
      } ${isAcknowledged ? "opacity-60" : ""} ${
        !isResolved && alert.severity === "critical" ? "alert-pulse" : ""
      }`}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: severityColor?.fg ?? "#232A35",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            {isResolved && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-secondary">
                Resolved
              </span>
            )}
            {isAcknowledged && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-primary">
                Acknowledged
              </span>
            )}
            {!isResolved && (
              <SeverityTrend
                current={alert.severity}
                previous={alert.previousSeverity}
              />
            )}
          </div>

          <h3 className="text-sm font-medium text-text-primary">
            {alert.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: readableProviderColor }}
            >
              <ProviderIcon providerKey={alert.source} size={13} />
              {providerName}
            </span>
            {alert.region && (
              <>
                <span className="text-border">|</span>
                <span>{alert.region}</span>
              </>
            )}
            <span className="text-border">|</span>
            <span>{formatRelativeTime(alert.timestamp)}</span>
            {!isResolved && avgResolutionMin != null && (
              <>
                <span className="text-border">|</span>
                <span className="text-text-secondary">
                  ~{formatDuration(avgResolutionMin)} avg resolution
                </span>
              </>
            )}
          </div>

          {alert.description && (
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {expanded
                ? alert.description
                : truncate(alert.description, 140)}
            </p>
          )}

          {/* Links section */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {alert.url && (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted transition-colors hover:text-text-primary"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Incident details
              </a>
            )}
            {provider?.statusUrl && (
              <a
                href={
                  isResolved && provider.historyUrl
                    ? provider.historyUrl
                    : provider.statusUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted transition-colors hover:text-text-primary"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {isResolved ? "Status history" : `${providerName} status`}
              </a>
            )}
          </div>

          {/* Structured metadata: components, CVSS, incident updates */}
          {Array.isArray(metadata?.components) && (
            <ComponentChips components={metadata.components as string[]} />
          )}
          {!!metadata?.cvss && (
            <CvssBreakdown cvss={metadata.cvss as React.ComponentProps<typeof CvssBreakdown>["cvss"]} />
          )}
          {Array.isArray(metadata?.updates) && (
            <IncidentTimeline
              updates={metadata.updates as React.ComponentProps<typeof IncidentTimeline>["updates"]}
            />
          )}
          {/* CISA KEV metadata */}
          {metadata?.ransomware === true && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-critical/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-critical">
              Known ransomware campaign
            </span>
          )}
          {typeof metadata?.dueDate === "string" && (
            <span className="mt-1 inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
              Remediation due: <span className={Number(metadata.daysUntilDue) <= 0 ? "text-critical font-medium" : Number(metadata.daysUntilDue) <= 7 ? "text-major font-medium" : "text-text-secondary"}>{String(metadata.dueDate)}</span>
            </span>
          )}

          {!isResolved && hasBlastRadius(alert.source) && (
            <BlastRadiusPanel provider={alert.source} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Alert action buttons (auth only) */}
          {isAuthenticated && showActions && !isResolved && (
            <>
              {userState ? (
                <button
                  onClick={() => clear(alert.id)}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                  aria-label="Undo"
                  title="Undo"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-secondary/10 hover:text-secondary"
                    aria-label="Acknowledge"
                    title="Acknowledge"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setSnoozeOpen(!snoozeOpen)}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="Snooze"
                      title="Snooze"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                    {snoozeOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] rounded-lg border border-border bg-card-solid p-1 shadow-lg">
                        {SNOOZE_OPTIONS.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleSnooze(opt.ms)}
                            className="block w-full rounded-md px-3 py-1.5 text-left font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-critical/10 hover:text-critical"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          )}

          {alert.description && alert.description.length > 140 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
