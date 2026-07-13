import useSWR from "swr";
import { useCallback } from "react";
import { BROWSER_STORAGE_KEYS, localId, readBrowserData, writeBrowserData } from "@/lib/browser-storage";

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

export function useDashboardViews() {
  const { data, error, isLoading, mutate } = useSWR<DashboardView[]>(
    BROWSER_STORAGE_KEYS.dashboards,
    () => readBrowserData<DashboardView[]>(BROWSER_STORAGE_KEYS.dashboards, []),
  );

  const persist = useCallback(async (views: DashboardView[]) => {
    writeBrowserData(BROWSER_STORAGE_KEYS.dashboards, views);
    await mutate(views, { revalidate: false });
  }, [mutate]);

  const createView = useCallback(
    async (view: {
      name: string;
      pinnedServices?: string[];
      selectedServices?: string[];
      filters?: { category?: string; severity?: string; status?: string };
      isDefault?: boolean;
    }) => {
      const now = new Date().toISOString();
      const current = data ?? readBrowserData<DashboardView[]>(BROWSER_STORAGE_KEYS.dashboards, []);
      const created: DashboardView = {
        id: localId("view"),
        name: view.name,
        layout: { selectedServices: view.selectedServices ?? [] },
        pinnedServices: view.pinnedServices ?? [],
        filters: view.filters ?? {},
        isDefault: view.isDefault ?? false,
        createdAt: now,
        updatedAt: now,
      };
      const next = created.isDefault
        ? [...current.map((item) => ({ ...item, isDefault: false })), created]
        : [...current, created];
      await persist(next);
      return created;
    },
    [data, persist],
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
      const current = data ?? readBrowserData<DashboardView[]>(BROWSER_STORAGE_KEYS.dashboards, []);
      let updated: DashboardView | undefined;
      const next = current.map((view) => {
        if (view.id !== id) return updates.isDefault ? { ...view, isDefault: false } : view;
        updated = {
          ...view,
          ...updates,
          layout: updates.selectedServices
            ? { selectedServices: updates.selectedServices }
            : view.layout,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      });
      if (!updated) throw new Error("Dashboard view not found");
      await persist(next);
      return updated;
    },
    [data, persist],
  );

  const deleteView = useCallback(
    async (id: string) => {
      const current = data ?? readBrowserData<DashboardView[]>(BROWSER_STORAGE_KEYS.dashboards, []);
      await persist(current.filter((view) => view.id !== id));
    },
    [data, persist],
  );

  return {
    views: data ?? [],
    isLoading,
    isError: !!error,
    createView,
    updateView,
    deleteView,
    mutate,
  };
}
