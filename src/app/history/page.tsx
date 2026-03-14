"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Calendar,
  List,
  Clock as ClockIcon,
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import type { HistoryFilters } from "@/hooks/useAlertHistory";
import { Timeline } from "@/components/history/Timeline";
import { HistoryTable } from "@/components/history/HistoryTable";
import { CATEGORY_LABELS, PROVIDERS, SEVERITY_COLORS } from "@/lib/constants";
import type { AlertCategory, AlertSeverity } from "@/lib/alert-schema";

type ViewMode = "timeline" | "table";

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

const SEVERITIES: { value: string; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "info", label: "Info" },
];

const STATUSES: { value: string; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "investigating", label: "Investigating" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORIES: { value: string; label: string }[] = Object.entries(
  CATEGORY_LABELS,
).map(([value, label]) => ({ value, label }));

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

export default function HistoryPage() {
  const [view, setView] = useState<ViewMode>("timeline");
  const defaults = useMemo(defaultDateRange, []);
  const [dateRange, setDateRange] = useState(defaults);
  const [filterValues, setFilterValues] = useState<{
    category: string;
    severity: string;
    source: string;
    status: string;
  }>({ category: "", severity: "", source: "", status: "" });

  const filters: HistoryFilters = useMemo(
    () => ({
      ...dateRange,
      ...(filterValues.category && { category: filterValues.category }),
      ...(filterValues.severity && { severity: filterValues.severity }),
      ...(filterValues.source && { source: filterValues.source }),
      ...(filterValues.status && { status: filterValues.status }),
    }),
    [dateRange, filterValues],
  );

  const {
    alerts,
    total,
    page,
    totalPages,
    stats,
    isLoading,
    sort,
    setPage,
    updateFilters,
    updateSort,
  } = useAlertHistory(filters);

  const handleDateChange = useCallback(
    (field: "startDate" | "endDate", value: string) => {
      const next = { ...dateRange, [field]: value };
      setDateRange(next);
      updateFilters({ ...filters, ...next });
    },
    [dateRange, filters, updateFilters],
  );

  const handleFilterChange = useCallback(
    (field: string, value: string) => {
      const next = { ...filterValues, [field]: value };
      setFilterValues(next);
      updateFilters({
        ...dateRange,
        ...(next.category && { category: next.category }),
        ...(next.severity && { severity: next.severity }),
        ...(next.source && { source: next.source }),
        ...(next.status && { status: next.status }),
      });
    },
    [filterValues, dateRange, updateFilters],
  );

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
          Alert History
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse and analyze past incidents across all monitored services.
        </p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Activity className="h-4 w-4 text-primary" />}
            label="Total Incidents"
            value={stats.totalIncidents.toString()}
          />
          <StatCard
            icon={<ClockIcon className="h-4 w-4 text-severity-info" />}
            label="Avg Resolution"
            value={
              stats.avgResolutionMinutes > 0
                ? formatMinutes(stats.avgResolutionMinutes)
                : "N/A"
            }
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-severity-critical" />}
            label="Most Affected"
            value={
              stats.topSources.length > 0
                ? PROVIDERS[stats.topSources[0].source]?.name ??
                  stats.topSources[0].source
                : "None"
            }
          />
          <StatCard
            icon={<BarChart3 className="h-4 w-4 text-severity-major" />}
            label="By Severity"
            value={
              <div className="flex items-center gap-1">
                {(["critical", "major", "minor", "info"] as const).map(
                  (sev) => {
                    const count = stats.severityBreakdown[sev] ?? 0;
                    if (count === 0) return null;
                    return (
                      <span
                        key={sev}
                        className="inline-flex items-center rounded px-1 py-0.5 font-[family-name:var(--font-mono)] text-[10px]"
                        style={{
                          color: SEVERITY_COLORS[sev].fg,
                          backgroundColor: SEVERITY_COLORS[sev].bg,
                        }}
                        title={`${sev}: ${count}`}
                      >
                        {count}
                      </span>
                    );
                  },
                )}
              </div>
            }
          />
        </div>
      )}

      {/* Controls: Date Range, Filters, View Toggle */}
      <div className="glass-card corner-brackets space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className="rounded-lg border border-border bg-surface-input px-2.5 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)]"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className="rounded-lg border border-border bg-surface-input px-2.5 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)]"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "timeline"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "table"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Category"
            value={filterValues.category}
            options={CATEGORIES}
            onChange={(v) => handleFilterChange("category", v)}
          />
          <FilterSelect
            label="Severity"
            value={filterValues.severity}
            options={SEVERITIES}
            onChange={(v) => handleFilterChange("severity", v)}
          />
          <FilterSelect
            label="Status"
            value={filterValues.status}
            options={STATUSES}
            onChange={(v) => handleFilterChange("status", v)}
          />

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                const empty = {
                  category: "",
                  severity: "",
                  source: "",
                  status: "",
                };
                setFilterValues(empty);
                updateFilters(dateRange);
              }}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
          {total} incident{total !== 1 ? "s" : ""} found
          {isLoading && " · Loading…"}
        </p>
      </div>

      {/* Content */}
      {view === "timeline" ? (
        <Timeline alerts={alerts} isLoading={isLoading} />
      ) : (
        <HistoryTable
          alerts={alerts}
          sort={sort}
          onSort={updateSort}
          isLoading={isLoading}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="font-[family-name:var(--font-mono)] text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass-card flex items-center gap-3 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <div className="text-sm font-semibold text-text-primary">{value}</div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-surface-input px-3 py-1.5 text-sm text-text-secondary transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)]"
    >
      <option value="">All {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
