"use client";

import { useEffect, useRef, useState } from "react";
import { useSWRConfig, type ScopedMutator } from "swr";
import type { SerializedAlert } from "@/lib/alert-schema";

export type SSEStatus = "connected" | "connecting" | "disconnected";

interface SSEEvent {
  type: "alert:new" | "alert:updated" | "alert:resolved";
  alert: SerializedAlert;
}

const MAX_RETRIES = 10;
const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

export function revalidateAlertQueries(mutate: ScopedMutator) {
  // A key-only mutation revalidates without replacing cached data
  // or resetting a refresh error while the request is in flight.
  return mutate((key: unknown) =>
    typeof key === "string" && key.startsWith("/api/alerts"),
  );
}

export function useSSE() {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const retriesRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    function connect() {
      if (esRef.current) {
        esRef.current.close();
      }

      setStatus("connecting");
      const es = new EventSource("/api/alerts/sse");
      esRef.current = es;

      es.onopen = () => {
        setStatus("connected");
        retriesRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          setLastEventAt(new Date());
          void revalidateAlertQueries(mutate);

          window.dispatchEvent(
            new CustomEvent("sse:alert", { detail: data }),
          );
        } catch {
          // Ignore parse errors (heartbeats, comments)
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setStatus("disconnected");

        if (retriesRef.current < MAX_RETRIES) {
          const delay = Math.min(
            BASE_DELAY * Math.pow(2, retriesRef.current),
            MAX_DELAY,
          );
          retriesRef.current++;
          setTimeout(connect, delay);
        }
      };
    }

    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [mutate]);

  return { status, lastEventAt };
}
