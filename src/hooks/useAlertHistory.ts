import useSWR from "swr";
import { useState, useCallback } from "react";
import type { SerializedAlert } from "@/lib/alert-schema";

export interface HistoryFilters {
  category?: string;
  severity?: string;
  source?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistorySort {
  field: string;
  order: "asc" | "desc";
}

export interface HistoryStats {
  totalIncidents: number;
  avgResolutionMinutes: number;
  severityBreakdown: Record<string, number>;
  topSources: { source: string; count: number }[];
}

interface HistoryResponse {
  alerts: SerializedAlert[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  stats: HistoryStats;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(
  page: number,
  limit: number,
  filters: HistoryFilters,
  sort: HistorySort,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("sort", sort.field);
  params.set("order", sort.order);

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  return `/api/alerts/history?${params.toString()}`;
}

export function useAlertHistory(
  initialFilters: HistoryFilters = {},
  pageSize = 25,
) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<HistoryFilters>(initialFilters);
  const [sort, setSort] = useState<HistorySort>({
    field: "timestamp",
    order: "desc",
  });

  const url = buildUrl(page, pageSize, filters, sort);
  const { data, error, isLoading } = useSWR<HistoryResponse>(url, fetcher, {
    keepPreviousData: true,
  });

  const updateFilters = useCallback((next: HistoryFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const updateSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }, []);

  return {
    alerts: data?.alerts ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    totalPages: data?.totalPages ?? 1,
    hasMore: data?.hasMore ?? false,
    stats: data?.stats ?? null,
    isLoading,
    isError: !!error,
    filters,
    sort,
    setPage,
    updateFilters,
    updateSort,
  };
}
