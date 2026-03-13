import useSWR from "swr";
import { useCallback } from "react";

export interface StackEntry {
  id: string;
  serviceName: string;
  provider: string;
  region: string | null;
  notes: string | null;
  createdAt: string;
}

interface StackResponse {
  stack: StackEntry[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStack() {
  const { data, error, isLoading, mutate } = useSWR<StackResponse>(
    "/api/stack",
    fetcher
  );

  const addService = useCallback(
    async (service: {
      serviceName: string;
      provider: string;
      region?: string;
      notes?: string;
    }) => {
      const res = await fetch("/api/stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      if (!res.ok) throw new Error("Failed to add service");
      await mutate();
    },
    [mutate]
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
      const res = await fetch("/api/stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      if (!res.ok) throw new Error("Failed to add services");
      await mutate();
    },
    [mutate]
  );

  const removeService = useCallback(
    async (id: string) => {
      const res = await fetch("/api/stack", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to remove service");
      await mutate();
    },
    [mutate]
  );

  return {
    stack: data?.stack ?? [],
    isLoading,
    isError: !!error,
    addService,
    addBulk,
    removeService,
    mutate,
  };
}
