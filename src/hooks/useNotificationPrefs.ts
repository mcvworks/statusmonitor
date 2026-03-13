import useSWR from "swr";
import { useCallback } from "react";

export interface NotificationPref {
  id?: string;
  channel: string;
  enabled: boolean;
  config: Record<string, unknown>;
  severityFilter: string[];
  sourceFilter: string[];
}

interface PrefsResponse {
  prefs: NotificationPref[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNotificationPrefs() {
  const { data, error, isLoading, mutate } = useSWR<PrefsResponse>(
    "/api/settings",
    fetcher,
  );

  const save = useCallback(
    async (prefs: NotificationPref[]) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      await mutate();
    },
    [mutate],
  );

  const sendTest = useCallback(async (channel: string) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", channel }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to send test notification");
    }
  }, []);

  return {
    prefs: data?.prefs ?? [],
    isLoading,
    isError: !!error,
    save,
    sendTest,
    mutate,
  };
}
