import { useCallback } from "react";
import { useSWRConfig } from "swr";
import type { UserAlertStateValue } from "@/lib/alert-schema";

async function updateAlertState(
  alertId: string,
  state: UserAlertStateValue,
  snoozedUntil?: string,
) {
  const res = await fetch(`/api/alerts/${alertId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, snoozedUntil }),
  });
  if (!res.ok) throw new Error("Failed to update alert state");
  return res.json();
}

async function clearAlertState(alertId: string) {
  const res = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear alert state");
  return res.json();
}

export function useAlertActions() {
  const { mutate } = useSWRConfig();

  const revalidate = useCallback(() => {
    // Revalidate all alert SWR keys
    mutate((key: unknown) => typeof key === "string" && key.startsWith("/api/alerts"));
  }, [mutate]);

  const acknowledge = useCallback(
    async (alertId: string) => {
      await updateAlertState(alertId, "acknowledged");
      revalidate();
    },
    [revalidate],
  );

  const snooze = useCallback(
    async (alertId: string, until: string) => {
      await updateAlertState(alertId, "snoozed", until);
      revalidate();
    },
    [revalidate],
  );

  const dismiss = useCallback(
    async (alertId: string) => {
      await updateAlertState(alertId, "dismissed");
      revalidate();
    },
    [revalidate],
  );

  const clear = useCallback(
    async (alertId: string) => {
      await clearAlertState(alertId);
      revalidate();
    },
    [revalidate],
  );

  return { acknowledge, snooze, dismiss, clear };
}
