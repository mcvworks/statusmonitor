import { prisma } from "@/lib/db";
import type { AlertProvider, AlertInput } from "@/lib/providers/types";
import { deduplicateAlerts } from "./dedup";
import { alertEventBus } from "./event-bus";

export interface PollResult {
  provider: string;
  alertsFound: number;
  newAlerts: number;
  updatedAlerts: number;
  error?: string;
}

/**
 * Poll a single provider: fetch → dedup → upsert → emit events → log.
 */
export async function pollProvider(
  provider: AlertProvider,
): Promise<PollResult> {
  const startedAt = new Date();
  let alertsFound = 0;
  let newCount = 0;
  let updatedCount = 0;
  let error: string | undefined;

  try {
    const incoming = await provider.fetchAlerts();
    alertsFound = incoming.length;

    const { new: newAlerts, updated: updatedAlerts } =
      await deduplicateAlerts(incoming);

    // Upsert new alerts
    for (const alert of newAlerts) {
      const created = await upsertAlert(alert);
      alertEventBus.emit("alert:new", created);
    }
    newCount = newAlerts.length;

    // Upsert updated alerts
    for (const alert of updatedAlerts) {
      const updated = await upsertAlert(alert);
      if (alert.status === "resolved") {
        alertEventBus.emit("alert:resolved", updated);
      } else {
        alertEventBus.emit("alert:updated", updated);
      }
    }
    updatedCount = updatedAlerts.length;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  // Log the poll cycle
  await prisma.pollLog
    .create({
      data: {
        provider: provider.name,
        startedAt,
        completedAt: new Date(),
        alertsFound,
        newAlerts: newCount,
        error,
      },
    })
    .catch(() => {
      // Don't let logging failure break polling
    });

  return {
    provider: provider.name,
    alertsFound,
    newAlerts: newCount,
    updatedAlerts: updatedCount,
    error,
  };
}

/**
 * Poll all providers in a tier concurrently. One failure won't affect others.
 */
export async function pollAll(
  tier: "fast" | "slow",
  providers: AlertProvider[],
): Promise<PollResult[]> {
  const tierProviders = providers.filter((p) => p.pollInterval === tier);

  if (tierProviders.length === 0) return [];

  const results = await Promise.allSettled(
    tierProviders.map((p) => pollProvider(p)),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      provider: tierProviders[i].name,
      alertsFound: 0,
      newAlerts: 0,
      updatedAlerts: 0,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });
}

// ─── Helpers ────────────────────────────────────────────────────

async function upsertAlert(alert: AlertInput) {
  // Check existing alert to track severity changes
  const existing = await prisma.alert.findUnique({
    where: {
      source_externalId: {
        source: alert.source,
        externalId: alert.externalId,
      },
    },
    select: { severity: true },
  });

  const previousSeverity =
    existing && existing.severity !== alert.severity
      ? existing.severity
      : existing
        ? undefined // no change — don't overwrite existing previousSeverity
        : null; // new alert — no previous severity

  const metadataJson = alert.metadata
    ? JSON.stringify(alert.metadata)
    : null;

  return prisma.alert.upsert({
    where: {
      source_externalId: {
        source: alert.source,
        externalId: alert.externalId,
      },
    },
    create: {
      externalId: alert.externalId,
      source: alert.source,
      category: alert.category,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      url: alert.url,
      region: alert.region,
      timestamp: alert.timestamp,
      status: alert.status,
      resolvedAt: alert.resolvedAt,
      previousSeverity: null,
      metadata: metadataJson,
    },
    update: {
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      url: alert.url,
      region: alert.region,
      status: alert.status,
      resolvedAt: alert.resolvedAt,
      metadata: metadataJson,
      ...(previousSeverity !== undefined
        ? { previousSeverity }
        : {}),
    },
  });
}
