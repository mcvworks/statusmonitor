import { useCallback } from "react";
import useSWR from "swr";
import type { UserAlertStateValue } from "@/lib/alert-schema";
import { BROWSER_STORAGE_KEYS, readBrowserData, writeBrowserData } from "@/lib/browser-storage";

export interface LocalAlertState {
  state: UserAlertStateValue;
  snoozedUntil: string | null;
  updatedAt: string;
}

export type LocalAlertStates = Record<string, LocalAlertState>;

export function useLocalAlertStates() {
  const { data, mutate } = useSWR<LocalAlertStates>(
    BROWSER_STORAGE_KEYS.alertStates,
    () => readBrowserData<LocalAlertStates>(BROWSER_STORAGE_KEYS.alertStates, {}),
  );
  return { states: data ?? {}, mutate };
}

export function useAlertActions() {
  const { states, mutate } = useLocalAlertStates();

  const update = useCallback(async (
    alertId: string,
    state: UserAlertStateValue,
    snoozedUntil: string | null = null,
  ) => {
    const current = readBrowserData<LocalAlertStates>(BROWSER_STORAGE_KEYS.alertStates, states);
    const next = { ...current, [alertId]: { state, snoozedUntil, updatedAt: new Date().toISOString() } };
    writeBrowserData(BROWSER_STORAGE_KEYS.alertStates, next);
    await mutate(next, { revalidate: false });
  }, [states, mutate]);

  const acknowledge = useCallback((alertId: string) => update(alertId, "acknowledged"), [update]);
  const snooze = useCallback((alertId: string, until: string) => update(alertId, "snoozed", until), [update]);
  const dismiss = useCallback((alertId: string) => update(alertId, "dismissed"), [update]);
  const clear = useCallback(async (alertId: string) => {
    const current = readBrowserData<LocalAlertStates>(BROWSER_STORAGE_KEYS.alertStates, states);
    const next = { ...current };
    delete next[alertId];
    writeBrowserData(BROWSER_STORAGE_KEYS.alertStates, next);
    await mutate(next, { revalidate: false });
  }, [states, mutate]);

  return { acknowledge, snooze, dismiss, clear };
}
