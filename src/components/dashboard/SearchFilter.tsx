"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CATEGORY_LABELS, PROVIDERS } from "@/lib/constants";
import type { AlertCategory, AlertSeverity, AlertStatus } from "@/lib/alert-schema";

export interface FilterValues {
  search: string;
  category: string;
  severity: string;
  status: string;
  source: string;
  sort: string;
}

interface SearchFilterProps {
  onChange: (filters: FilterValues) => void;
}

const SEVERITIES: { value: AlertSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "info", label: "Info" },
];

const STATUSES: { value: AlertStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "investigating", label: "Investigating" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORIES: { value: AlertCategory; label: string }[] = Object.entries(
  CATEGORY_LABELS,
).map(([value, label]) => ({ value: value as AlertCategory, label }));

const SOURCES: { value: string; label: string }[] = Object.entries(PROVIDERS)
  .map(([value, meta]) => ({ value, label: meta.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

// "Newest first" is the feed's default order, so it is the empty choice.
const SORTS: { value: string; label: string }[] = [
  { value: "severity", label: "Sort: severity" },
  { value: "provider", label: "Sort: provider A–Z" },
];

const SEVERITY_LABELS = Object.fromEntries(
  SEVERITIES.map(({ value, label }) => [value, label]),
);
const STATUS_LABELS = Object.fromEntries(
  STATUSES.map(({ value, label }) => [value, label]),
);

function readParams(params: URLSearchParams): FilterValues {
  return {
    search: params.get("q") ?? "",
    category: params.get("category") ?? "",
    severity: params.get("severity") ?? "",
    status: params.get("status") ?? "",
    source: params.get("source") ?? "",
    sort: params.get("sort") ?? "",
  };
}

export function SearchFilter({ onChange }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterValues>(() =>
    readParams(searchParams),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync URL → state whenever search params change (e.g. provider icon click)
  useEffect(() => {
    const vals = readParams(searchParams);
    setFilters(vals);
    onChange(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const pushToUrl = useCallback(
    (next: FilterValues) => {
      const params = new URLSearchParams();
      if (next.search) params.set("q", next.search);
      if (next.category) params.set("category", next.category);
      if (next.severity) params.set("severity", next.severity);
      if (next.status) params.set("status", next.status);
      if (next.source) params.set("source", next.source);
      if (next.sort) params.set("sort", next.sort);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router],
  );

  const update = useCallback(
    (partial: Partial<FilterValues>, debounce = false) => {
      setFilters((prev) => {
        const next = { ...prev, ...partial };
        if (debounce) {
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            onChange(next);
            pushToUrl(next);
          }, 300);
        } else {
          onChange(next);
          pushToUrl(next);
        }
        return next;
      });
    },
    [onChange, pushToUrl],
  );

  const clearAll = useCallback(() => {
    const empty: FilterValues = {
      search: "",
      category: "",
      severity: "",
      status: "",
      source: "",
      sort: "",
    };
    setFilters(empty);
    onChange(empty);
    pushToUrl(empty);
  }, [onChange, pushToUrl]);

  const activeChips = [
    filters.category && {
      key: "category",
      label: CATEGORY_LABELS[filters.category as AlertCategory] ?? filters.category,
    },
    filters.severity && {
      key: "severity",
      label: SEVERITY_LABELS[filters.severity] ?? filters.severity,
    },
    filters.status && {
      key: "status",
      label: STATUS_LABELS[filters.status] ?? filters.status,
    },
    filters.source && {
      key: "source",
      label: PROVIDERS[filters.source]?.name ?? filters.source,
    },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input */}
        <div className="relative min-w-0 flex-[4_1_200px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search alerts"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value }, true)}
            placeholder="Search alerts…"
            className="w-full rounded-lg border border-border bg-surface-input py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)] [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => update({ search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Sort select */}
        <FilterSelect
          label="Sort alerts"
          emptyLabel="Sort: newest first"
          value={filters.sort === "newest" ? "" : filters.sort}
          options={SORTS}
          onChange={(v) => update({ sort: v })}
          className="min-w-0 flex-[1_1_180px] py-2"
        />

        {/* Toggle filters */}
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="alert-filter-menu"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            filtersOpen || activeChips.length > 0
              ? "border-primary/30 bg-[rgba(242,194,0,0.06)] text-primary-ink"
              : "border-border text-text-secondary hover:bg-surface-hover"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeChips.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-[#0F1114]">
              {activeChips.length}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>
      </div>

      {/* Filter dropdowns */}
      {filtersOpen && (
        <div id="alert-filter-menu" className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Filter by category"
            emptyLabel="All categories"
            value={filters.category}
            options={CATEGORIES}
            onChange={(v) => update({ category: v })}
          />
          <FilterSelect
            label="Filter by severity"
            emptyLabel="All severities"
            value={filters.severity}
            options={SEVERITIES}
            onChange={(v) => update({ severity: v })}
          />
          <FilterSelect
            label="Filter by status"
            emptyLabel="All statuses"
            value={filters.status}
            options={STATUSES}
            onChange={(v) => update({ status: v })}
          />
          <FilterSelect
            label="Filter by provider"
            emptyLabel="All providers"
            value={filters.source}
            options={SOURCES}
            onChange={(v) => update({ source: v })}
          />
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-hover px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-secondary"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label} filter`}
                onClick={() => update({ [chip.key]: "" })}
                className="ml-0.5 rounded hover:text-text-primary"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="rounded px-1 text-xs text-text-secondary underline-offset-2 hover:text-primary-ink hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  emptyLabel,
  value,
  options,
  onChange,
  className = "py-1.5",
}: {
  /** Accessible name for the control. */
  label: string;
  /** Text of the choice that applies no filter. */
  emptyLabel: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-border bg-surface-input px-3 text-sm text-text-secondary transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-[rgba(242,194,0,0.08)] ${className}`}
    >
      <option value="">{emptyLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
