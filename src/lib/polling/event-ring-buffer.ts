import type { Alert } from "@/generated/prisma/client";
import { alertEventBus } from "./event-bus";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";

// ─── Event Types ────────────────────────────────────────────────

export type EventType =
  | "new"
  | "updated"
  | "resolved"
  | "escalated"
  | "de-escalated";

export interface AlertEvent {
  type: EventType;
  alertId: string;
  source: string;
  title: string;
  severity: string;
  previousSeverity: string | null;
  timestamp: string; // ISO string
}

// ─── Ring Buffer ────────────────────────────────────────────────

const MAX_EVENTS = 100;

class EventRingBuffer {
  private buffer: AlertEvent[] = [];

  push(event: AlertEvent) {
    this.buffer.push(event);
    if (this.buffer.length > MAX_EVENTS) {
      this.buffer = this.buffer.slice(-MAX_EVENTS);
    }
  }

  getAll(): AlertEvent[] {
    return [...this.buffer];
  }

  getRecent(n: number): AlertEvent[] {
    return this.buffer.slice(-n);
  }
}

// ─── Singleton ──────────────────────────────────────────────────

const globalForBuffer = globalThis as unknown as {
  eventRingBuffer: EventRingBuffer | undefined;
  eventRingBufferWired: boolean | undefined;
};

export const eventRingBuffer =
  globalForBuffer.eventRingBuffer ?? new EventRingBuffer();

if (process.env.NODE_ENV !== "production") {
  globalForBuffer.eventRingBuffer = eventRingBuffer;
}

// ─── Wire to Event Bus ─────────────────────────────────────────

function classifyEvent(alert: Alert, busEventType: string): EventType {
  if (busEventType === "alert:new") return "new";
  if (busEventType === "alert:resolved") return "resolved";

  // Check for escalation / de-escalation
  if (alert.previousSeverity && alert.previousSeverity !== alert.severity) {
    const currentRank = SEVERITY_ORDER[alert.severity as AlertSeverity] ?? 3;
    const prevRank =
      SEVERITY_ORDER[alert.previousSeverity as AlertSeverity] ?? 3;
    return currentRank < prevRank ? "escalated" : "de-escalated";
  }

  return "updated";
}

function alertToEvent(alert: Alert, busEventType: string): AlertEvent {
  return {
    type: classifyEvent(alert, busEventType),
    alertId: alert.id,
    source: alert.source,
    title: alert.title,
    severity: alert.severity,
    previousSeverity: alert.previousSeverity,
    timestamp: new Date().toISOString(),
  };
}

export function wireEventRingBuffer() {
  if (globalForBuffer.eventRingBufferWired) return;
  globalForBuffer.eventRingBufferWired = true;

  alertEventBus.on("alert:new", (alert) => {
    eventRingBuffer.push(alertToEvent(alert, "alert:new"));
  });

  alertEventBus.on("alert:updated", (alert) => {
    eventRingBuffer.push(alertToEvent(alert, "alert:updated"));
  });

  alertEventBus.on("alert:resolved", (alert) => {
    eventRingBuffer.push(alertToEvent(alert, "alert:resolved"));
  });
}
