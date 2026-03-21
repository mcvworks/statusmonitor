"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Clock,
} from "lucide-react";
import type { SerializedAlert, AlertSeverity } from "@/lib/alert-schema";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { ProviderIcon } from "@/components/dashboard/ProviderIcon";
import { PROVIDERS } from "@/lib/constants";
import type { HistorySort } from "@/hooks/useAlertHistory";

interface HistoryTableProps {
  alerts: SerializedAlert[];
  sort: HistorySort;
  onSort: (field: string) => void;
  isLoading: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: "text-severity-critical",
  investigating: "text-severity-major",
  monitoring: "text-severity-minor",
  resolved: "text-severity-info",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startStr: string, endStr: string | null): string {
  if (!endStr) return "Ongoing";
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  if (ms < 0) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

function SortIcon({
  field,
  sort,
}: {
  field: string;
  sort: HistorySort;
}) {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3" />;
  return sort.order === "asc" ? (
    <ArrowUp className="h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" />
  );
}

function exportToCsv(alerts: SerializedAlert[]) {
  const headers = [
    "Timestamp",
    "Source",
    "Severity",
    "Title",
    "Status",
    "Duration",
    "Description",
    "URL",
  ];
  const rows = alerts.map((a) => [
    new Date(a.timestamp).toISOString(),
    PROVIDERS[a.source]?.name ?? a.source,
    a.severity,
    `"${(a.title ?? "").replace(/"/g, '""')}"`,
    a.status,
    formatDuration(a.timestamp, a.resolvedAt),
    `"${(a.description ?? "").replace(/"/g, '""')}"`,
    a.url ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `alert-history-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryTable({
  alerts,
  sort,
  onSort,
  isLoading,
}: HistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading && alerts.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-surface-hover"
          />
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

  const columns: { key: string; label: string; sortable: boolean }[] = [
    { key: "timestamp", label: "Time", sortable: true },
    { key: "source", label: "Source", sortable: true },
    { key: "severity", label: "Severity", sortable: true },
    { key: "title", label: "Title", sortable: false },
    { key: "status", label: "Status", sortable: true },
    { key: "duration", label: "Duration", sortable: false },
  ];

  return (
    <div>
      {/* Export button */}
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => exportToCsv(alerts)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-card">
              <th className="w-8 px-3 py-3" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-wider text-text-muted"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-text-primary transition-colors"
                    >
                      {col.label}
                      <SortIcon field={col.key} sort={sort} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => {
              const isExpanded = expandedId === alert.id;
              const providerName =
                PROVIDERS[alert.source]?.name ?? alert.source;

              return (
                <tr key={alert.id} className="group">
                  <td colSpan={7} className="p-0">
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : alert.id)
                      }
                      className="flex w-full items-center border-b border-border transition-colors hover:bg-surface-hover"
                    >
                      <span className="w-8 px-3 py-3 text-text-muted">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-text-muted">
                        {formatDateTime(alert.timestamp)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-3"
                        style={{ color: PROVIDERS[alert.source]?.color }}
                      >
                        <ProviderIcon providerKey={alert.source} size={13} />
                        {providerName}
                      </span>
                      <span className="px-3 py-3">
                        <SeverityBadge
                          severity={alert.severity as AlertSeverity}
                        />
                      </span>
                      <span className="flex-1 truncate px-3 py-3 text-left text-text-primary">
                        {alert.title}
                      </span>
                      <span
                        className={`px-3 py-3 text-xs font-medium capitalize ${STATUS_STYLES[alert.status] ?? "text-text-muted"}`}
                      >
                        {alert.status}
                      </span>
                      <span className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(alert.timestamp, alert.resolvedAt)}
                        </span>
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-b border-border bg-[var(--expanded-row-bg)] px-10 py-4">
                        <div className="text-sm text-text-secondary">
                          {alert.description ? (
                            <p className="whitespace-pre-wrap">
                              {alert.description}
                            </p>
                          ) : (
                            <p className="italic text-text-muted">
                              No description available
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
                            {alert.region && (
                              <span>Region: {alert.region}</span>
                            )}
                            <span>
                              Category: {alert.category}
                            </span>
                            {alert.resolvedAt && (
                              <span>
                                Resolved: {formatDateTime(alert.resolvedAt)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {alert.url && (
                              <a
                                href={alert.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Incident details{" "}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {PROVIDERS[alert.source]?.statusUrl && (
                              <a
                                href={
                                  alert.status === "resolved" && PROVIDERS[alert.source]?.historyUrl
                                    ? PROVIDERS[alert.source].historyUrl!
                                    : PROVIDERS[alert.source].statusUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary hover:underline"
                              >
                                {alert.status === "resolved" ? "Status history" : `${providerName} status`}{" "}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
