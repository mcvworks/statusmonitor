import useSWR from "swr";

export type ProviderDataState =
  | "healthy"
  | "error"
  | "stale"
  | "not_configured"
  | "pending";

export interface ProviderHealth {
  state: ProviderDataState;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  lastAlertCount: number;
}

type ProviderHealthResponse = Record<string, ProviderHealth>;

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function useProviderHealth() {
  const { data, error, isLoading } = useSWR<ProviderHealthResponse>(
    "/api/providers/health",
    fetcher,
    { refreshInterval: 30_000 },
  );
  return {
    providers: data ?? {},
    isLoading,
    isError: !!error,
  };
}
