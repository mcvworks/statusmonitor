import useSWR from "swr";
import type { SerializedAlertWithState } from "@/lib/alert-schema";

interface AlertFilters {
  category?: string;
  severity?: string;
  source?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface AlertsResponse {
  alerts: SerializedAlertWithState[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  avgResolutionBySource: Record<string, number>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(filters: AlertFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `/api/alerts${qs ? `?${qs}` : ""}`;
}

export function useAlerts(filters: AlertFilters = {}) {
  const url = buildUrl(filters);
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    url,
    fetcher,
    { refreshInterval: 30_000 },
  );

  return {
    alerts: data?.alerts ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    avgResolutionBySource: data?.avgResolutionBySource ?? {},
    isLoading,
    isError: !!error,
    mutate,
  };
}
