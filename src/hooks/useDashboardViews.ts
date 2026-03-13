import useSWR from "swr";
import { useCallback } from "react";

export interface DashboardView {
  id: string;
  name: string;
  layout: { selectedServices: string[] };
  pinnedServices: string[];
  filters: { category?: string; severity?: string; status?: string };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardViewsResponse {
  dashboards: DashboardView[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboardViews() {
  const { data, error, isLoading, mutate } = useSWR<DashboardViewsResponse>(
    "/api/dashboard",
    fetcher,
  );

  const createView = useCallback(
    async (view: {
      name: string;
      pinnedServices?: string[];
      selectedServices?: string[];
      filters?: { category?: string; severity?: string; status?: string };
      isDefault?: boolean;
    }) => {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(view),
      });
      if (!res.ok) throw new Error("Failed to create view");
      const json = await res.json();
      await mutate();
      return json.dashboard as DashboardView;
    },
    [mutate],
  );

  const updateView = useCallback(
    async (
      id: string,
      updates: Partial<{
        name: string;
        pinnedServices: string[];
        selectedServices: string[];
        filters: { category?: string; severity?: string; status?: string };
        isDefault: boolean;
      }>,
    ) => {
      const res = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update view");
      const json = await res.json();
      await mutate();
      return json.dashboard as DashboardView;
    },
    [mutate],
  );

  const deleteView = useCallback(
    async (id: string) => {
      const res = await fetch("/api/dashboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete view");
      await mutate();
    },
    [mutate],
  );

  return {
    views: data?.dashboards ?? [],
    isLoading,
    isError: !!error,
    createView,
    updateView,
    deleteView,
    mutate,
  };
}
