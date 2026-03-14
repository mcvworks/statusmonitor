"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Clock } from "lucide-react";
import type { SerializedAlert } from "@/lib/alert-schema";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { PROVIDERS } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import { SEVERITY_COLORS } from "@/lib/constants";

interface TimelineProps {
  alerts: SerializedAlert[];
  isLoading: boolean;
}

function groupByDay(alerts: SerializedAlert[]): Map<string, SerializedAlert[]> {
  const groups = new Map<string, SerializedAlert[]>();
  for (const alert of alerts) {
    const day = new Date(alert.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const group = groups.get(day) ?? [];
    group.push(alert);
    groups.set(day, group);
  }
  return groups;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startStr: string, endStr: string | null): string | null {
  if (!endStr) return null;
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms < 0) return null;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

function TimelineNode({ alert }: { alert: SerializedAlert }) {
  const [expanded, setExpanded] = useState(false);
  const providerName =
    PROVIDERS[alert.source]?.name ?? alert.source;
  const duration = formatDuration(alert.timestamp, alert.resolvedAt);
  const colors = SEVERITY_COLORS[alert.severity as AlertSeverity];

  return (
    <div className="group relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border group-last:hidden" />

      {/* Dot */}
      <div
        className="relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2"
        style={{
          borderColor: colors.fg,
          backgroundColor: colors.bg,
          boxShadow: `0 0 8px ${colors.fg}40`,
        }}
      >
        <div
          className="absolute inset-[5px] rounded-full"
          style={{ backgroundColor: colors.fg }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start gap-2 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
                {formatTime(alert.timestamp)}
              </span>
              <SeverityBadge severity={alert.severity as AlertSeverity} />
              <span className="text-xs text-text-muted">{providerName}</span>
              {alert.status === "resolved" && (
                <span className="rounded-full bg-[rgba(72,224,199,0.1)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-severity-info">
                  Resolved
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-text-primary truncate">
              {alert.title}
            </p>
            {duration && (
              <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                <Clock className="h-3 w-3" />
                <span>Duration: {duration}</span>
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
          ) : (
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
          )}
        </button>

        {expanded && (
          <div className="mt-2 rounded-lg border border-border bg-[var(--t-surface-card)] p-3 text-sm text-text-secondary">
            {alert.description ? (
              <p className="whitespace-pre-wrap">{alert.description}</p>
            ) : (
              <p className="italic text-text-muted">No description available</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
              {alert.region && <span>Region: {alert.region}</span>}
              <span>Status: {alert.status}</span>
              {alert.resolvedAt && (
                <span>
                  Resolved: {formatTime(alert.resolvedAt)}
                </span>
              )}
            </div>
            {alert.url && (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View details <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Timeline({ alerts, isLoading }: TimelineProps) {
  if (isLoading && alerts.length === 0) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-[22px] w-[22px] rounded-full bg-surface-hover" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-surface-hover" />
              <div className="h-4 w-72 rounded bg-surface-hover" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-muted">No incidents found for this period.</p>
      </div>
    );
  }

  const grouped = groupByDay(alerts);

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([day, dayAlerts]) => (
        <div key={day}>
          <h3 className="section-label mb-4">{day}</h3>
          <div className="ml-2">
            {dayAlerts.map((alert) => (
              <TimelineNode key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
