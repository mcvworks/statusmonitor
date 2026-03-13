import useSWR from "swr";
import type { AffectedService } from "@/lib/dependencies/resolver";

interface DependencyMapEntry {
  provider: string;
  serviceCount: number;
}

interface DependencyMapResponse {
  providers: DependencyMapEntry[];
  totalMappings: number;
}

interface ProviderDependenciesResponse {
  provider: string;
  region: string | null;
  services: AffectedService[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Fetch the full dependency map summary (all providers + counts).
 */
export function useDependencyMap() {
  const { data, error, isLoading } = useSWR<DependencyMapResponse>(
    "/api/dependencies",
    fetcher,
    { refreshInterval: 60_000 },
  );

  return {
    providers: data?.providers ?? [],
    totalMappings: data?.totalMappings ?? 0,
    isLoading,
    isError: !!error,
  };
}

/**
 * Fetch affected services for a specific provider, enriched with active alert status.
 */
export function useProviderDependencies(provider: string | null) {
  const { data, error, isLoading } = useSWR<ProviderDependenciesResponse>(
    provider ? `/api/dependencies?provider=${provider}&active=true` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  return {
    services: data?.services ?? [],
    isLoading,
    isError: !!error,
  };
}
