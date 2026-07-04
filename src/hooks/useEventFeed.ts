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

export function useEventFeed(limit = 50, source?: string) {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  // Which URL the list was seeded from — a changed source/limit yields a
  // new URL, so the next fetch re-seeds the list wholesale
  const seededUrlRef = useRef<string | null>(null);

  // Seed from alert history (filtered server-side when a source is set);
  // afterwards SSE keeps the list current. Seeding happens in onSuccess
  // rather than an effect so initial data doesn't cascade re-renders.
  const url = `/api/alerts/events?limit=${limit}${
    source ? `&source=${encodeURIComponent(source)}` : ""
  }`;
  useSWR<EventsResponse>(url, fetcher, {
    refreshInterval: 30_000,
    onSuccess: (data) => {
      if (data?.events && seededUrlRef.current !== url) {
        seededUrlRef.current = url;
        setEvents(data.events);
      }
    },
  });

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
    if (source && detail.alert.source !== source) return;

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
  }, [limit, source]);

  useEffect(() => {
    window.addEventListener("sse:alert", handleSSE);
    return () => window.removeEventListener("sse:alert", handleSSE);
  }, [handleSSE]);

  return { events };
}
