import useSWR from "swr";
import type { AlertSeverity } from "@/lib/alert-schema";

export interface ProviderStats {
  windowDays: number;
  incidents: number;
  quietDays: number;
  worstSeverity: AlertSeverity | null;
  avgResolutionMin: number | null;
  lastIncidentAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProviderStats(source: string | undefined) {
  const { data, error, isLoading } = useSWR<ProviderStats>(
    source ? `/api/alerts/stats?source=${encodeURIComponent(source)}` : null,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 },
  );

  return {
    stats: data && !("error" in data) ? data : null,
    isLoading,
    isError: !!error,
  };
}
