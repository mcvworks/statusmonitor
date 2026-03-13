"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import type { SerializedAlert } from "@/lib/alert-schema";

export type SSEStatus = "connected" | "connecting" | "disconnected";

interface SSEEvent {
  type: "alert:new" | "alert:updated" | "alert:resolved";
  alert: SerializedAlert;
}

const MAX_RETRIES = 10;
const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

export function useSSE() {
  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const retriesRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const { mutate } = useSWRConfig();

  const connect = useCallback(() => {
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
        // Invalidate SWR cache so useAlerts re-fetches
        mutate(
          (key: string) => typeof key === "string" && key.startsWith("/api/alerts"),
          undefined,
          { revalidate: true },
        );

        // Also fire a custom event for components that want instant updates
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
  }, [mutate]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { status };
}
