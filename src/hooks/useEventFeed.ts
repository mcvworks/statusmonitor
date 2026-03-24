"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import useSWR from "swr";
import type { AlertEvent } from "@/lib/polling/event-ring-buffer";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";

interface EventsResponse {
  events: AlertEvent[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SSEEventType = "alert:new" | "alert:updated" | "alert:resolved";

function classifySSEEvent(
  type: SSEEventType,
  alert: { severity: string; previousSeverity?: string | null },
): AlertEvent["type"] {
  if (type === "alert:new") return "new";
  if (type === "alert:resolved") return "resolved";

  if (alert.previousSeverity && alert.previousSeverity !== alert.severity) {
    const currentRank = SEVERITY_ORDER[alert.severity as AlertSeverity] ?? 3;
    const prevRank =
      SEVERITY_ORDER[alert.previousSeverity as AlertSeverity] ?? 3;
    return currentRank < prevRank ? "escalated" : "de-escalated";
  }

  return "updated";
}

export function useEventFeed(limit = 50) {
  const { data } = useSWR<EventsResponse>(
    `/api/alerts/events?limit=${limit}`,
    fetcher,
    { refreshInterval: 30_000 },
  );

  const [events, setEvents] = useState<AlertEvent[]>([]);
  const initializedRef = useRef(false);

  // Seed from SWR data on first load
  useEffect(() => {
    if (data?.events && !initializedRef.current) {
      setEvents(data.events);
      initializedRef.current = true;
    }
  }, [data]);

  // Listen for real-time SSE events
  const handleSSE = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as {
      type: SSEEventType;
      alert: {
        id: string;
        source: string;
        title: string;
        severity: string;
        previousSeverity?: string | null;
      };
    };
    if (!detail?.alert) return;

    const event: AlertEvent = {
      type: classifySSEEvent(detail.type, detail.alert),
      alertId: detail.alert.id,
      source: detail.alert.source,
      title: detail.alert.title,
      severity: detail.alert.severity,
      previousSeverity: detail.alert.previousSeverity ?? null,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => {
      const next = [...prev, event];
      return next.length > limit ? next.slice(-limit) : next;
    });
  }, [limit]);

  useEffect(() => {
    window.addEventListener("sse:alert", handleSSE);
    return () => window.removeEventListener("sse:alert", handleSSE);
  }, [handleSSE]);

  return { events };
}
