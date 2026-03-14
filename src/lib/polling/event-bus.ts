import { EventEmitter } from "events";
import type { Alert } from "@/generated/prisma/client";

// ─── Event Types ────────────────────────────────────────────────

export interface AlertEventMap {
  "alert:new": [alert: Alert];
  "alert:updated": [alert: Alert];
  "alert:resolved": [alert: Alert];
}

export type AlertEventName = keyof AlertEventMap;

// ─── Typed Event Bus ────────────────────────────────────────────

class AlertEventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Allow many listeners (one per SSE connection)
    this.emitter.setMaxListeners(200);
  }

  on<K extends AlertEventName>(
    event: K,
    listener: (...args: AlertEventMap[K]) => void,
  ) {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<K extends AlertEventName>(
    event: K,
    listener: (...args: AlertEventMap[K]) => void,
  ) {
    this.emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }

  emit<K extends AlertEventName>(event: K, ...args: AlertEventMap[K]) {
    this.emitter.emit(event, ...args);
  }

  removeAllListeners() {
    this.emitter.removeAllListeners();
  }
}

// ─── Singleton ──────────────────────────────────────────────────

const globalForBus = globalThis as unknown as {
  alertEventBus: AlertEventBus | undefined;
};

export const alertEventBus =
  globalForBus.alertEventBus ?? new AlertEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForBus.alertEventBus = alertEventBus;
}
