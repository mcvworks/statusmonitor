import { schedule, type ScheduledTask } from "node-cron";
import type { AlertProvider } from "@/lib/providers/types";
import { pollAll } from "./engine";

let fastTask: ScheduledTask | null = null;
let slowTask: ScheduledTask | null = null;

// Provider registry — providers register themselves here
const providers: AlertProvider[] = [];

export function registerProvider(provider: AlertProvider) {
  providers.push(provider);
}

export function registerProviders(list: AlertProvider[]) {
  providers.push(...list);
}

export function getRegisteredProviders(): readonly AlertProvider[] {
  return providers;
}

/**
 * Start the polling scheduler.
 * - Fast tier: every 2 minutes
 * - Slow tier: every 5 minutes
 * - Runs an initial poll immediately on startup
 */
export function startScheduler() {
  if (fastTask || slowTask) {
    console.log("[scheduler] Already running, skipping start");
    return;
  }

  console.log(
    `[scheduler] Starting with ${providers.length} registered providers`,
  );

  // Initial poll on startup
  pollAll("fast", providers).then((results) => {
    logResults("fast", results);
  });
  pollAll("slow", providers).then((results) => {
    logResults("slow", results);
  });

  // Schedule recurring polls
  fastTask = schedule("*/2 * * * *", async () => {
    const results = await pollAll("fast", providers);
    logResults("fast", results);
  });

  slowTask = schedule("*/5 * * * *", async () => {
    const results = await pollAll("slow", providers);
    logResults("slow", results);
  });
}

export function stopScheduler() {
  fastTask?.stop();
  slowTask?.stop();
  fastTask = null;
  slowTask = null;
  console.log("[scheduler] Stopped");
}

function logResults(
  tier: string,
  results: Awaited<ReturnType<typeof pollAll>>,
) {
  const total = results.reduce((sum, r) => sum + r.newAlerts, 0);
  const errors = results.filter((r) => r.error).length;
  console.log(
    `[scheduler] ${tier} poll: ${results.length} providers, ${total} new alerts, ${errors} errors`,
  );
}
