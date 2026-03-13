import type { Alert } from "@/generated/prisma/client";
import { alertEventBus } from "@/lib/polling/event-bus";
import { dispatchNotifications } from "./dispatcher";

let initialized = false;
let pendingAlerts: Alert[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Batch window — collect alerts for 5s after last event, then dispatch
const BATCH_WINDOW_MS = 5_000;

/**
 * Initialize the notification integration.
 * Listens to the event bus and batches new alerts for dispatch.
 * Safe to call multiple times — only initializes once.
 */
export function initNotifications() {
  if (initialized) return;
  initialized = true;

  alertEventBus.on("alert:new", (alert: Alert) => {
    pendingAlerts.push(alert);
    scheduleFlush();
  });

  alertEventBus.on("alert:updated", (alert: Alert) => {
    // Only notify for severity escalations (not every update)
    if (alert.severity === "critical" || alert.severity === "major") {
      pendingAlerts.push(alert);
      scheduleFlush();
    }
  });

  console.log("[notifications] Integration initialized");
}

function scheduleFlush() {
  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(flush, BATCH_WINDOW_MS);
}

async function flush() {
  flushTimeout = null;
  if (pendingAlerts.length === 0) return;

  const batch = pendingAlerts;
  pendingAlerts = [];

  try {
    await dispatchNotifications(batch);
    console.log(`[notifications] Dispatched ${batch.length} alerts`);
  } catch (err) {
    console.error("[notifications] Dispatch failed:", err);
  }
}
