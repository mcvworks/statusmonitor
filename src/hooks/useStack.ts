import useSWR from "swr";
import { useCallback } from "react";
import { BROWSER_STORAGE_KEYS, localId, readBrowserData, writeBrowserData } from "@/lib/browser-storage";

export interface StackEntry {
  id: string;
  serviceName: string;
  provider: string;
  region: string | null;
  notes: string | null;
  createdAt: string;
}

export function useStack() {
  const { data, error, isLoading, mutate } = useSWR<StackEntry[]>(
    BROWSER_STORAGE_KEYS.stack,
    () => readBrowserData<StackEntry[]>(BROWSER_STORAGE_KEYS.stack, []),
  );

  const persist = useCallback(async (stack: StackEntry[]) => {
    writeBrowserData(BROWSER_STORAGE_KEYS.stack, stack);
    await mutate(stack, { revalidate: false });
  }, [mutate]);

  const addService = useCallback(
    async (service: {
      serviceName: string;
      provider: string;
      region?: string;
      notes?: string;
    }) => {
      const current = data ?? readBrowserData<StackEntry[]>(BROWSER_STORAGE_KEYS.stack, []);
      const now = new Date().toISOString();
      await persist([...current, {
        id: localId("stack"),
        serviceName: service.serviceName,
        provider: service.provider,
        region: service.region ?? null,
        notes: service.notes ?? null,
        createdAt: now,
      }]);
    },
    [data, persist]
  );

  const addBulk = useCallback(
    async (
      services: Array<{
        serviceName: string;
        provider: string;
        region?: string;
        notes?: string;
      }>
    ) => {
      const current = data ?? readBrowserData<StackEntry[]>(BROWSER_STORAGE_KEYS.stack, []);
      const createdAt = new Date().toISOString();
      const existing = new Set(current.map((item) => `${item.provider}:${item.serviceName}`));
      const additions = services.filter((service) => !existing.has(`${service.provider}:${service.serviceName}`)).map((service) => ({
        id: localId("stack"), serviceName: service.serviceName, provider: service.provider,
        region: service.region ?? null, notes: service.notes ?? null, createdAt,
      }));
      await persist([...current, ...additions]);
    },
    [data, persist]
  );

  const removeService = useCallback(
    async (id: string) => {
      const current = data ?? readBrowserData<StackEntry[]>(BROWSER_STORAGE_KEYS.stack, []);
      await persist(current.filter((entry) => entry.id !== id));
    },
    [data, persist]
  );

  return {
    stack: data ?? [],
    isLoading,
    isError: !!error,
    addService,
    addBulk,
    removeService,
    mutate,
  };
}
