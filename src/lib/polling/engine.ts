import { prisma } from "@/lib/db";
import type { AlertProvider, AlertInput } from "@/lib/providers/types";
import { deduplicateAlerts } from "./dedup";
import { alertEventBus } from "./event-bus";

export interface PollResult {
  provider: string;
  alertsFound: number;
  newAlerts: number;
  updatedAlerts: number;
  skipped?: boolean;
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

  if (provider.minimumIntervalMs) {
    const state = await prisma.providerState.findUnique({
      where: { provider: provider.name },
      select: { lastSuccessAt: true },
    });
    if (
      state?.lastSuccessAt &&
      Date.now() - state.lastSuccessAt.getTime() < provider.minimumIntervalMs
    ) {
      return {
        provider: provider.name,
        alertsFound: 0,
        newAlerts: 0,
        updatedAlerts: 0,
        skipped: true,
      };
    }
  }

  try {
    const incoming = await provider.fetchAlerts();
    alertsFound = incoming.length;

    const { new: newAlerts, updated: updatedAlerts, unchanged } =
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

    // Even unchanged observations need a heartbeat so freshness and expiry
    // represent the latest successful observation without emitting UI events.
    for (const alert of unchanged) {
      await prisma.alert.update({
        where: {
          source_externalId: {
            source: alert.source,
            externalId: alert.externalId,
          },
        },
        data: {
          lastObservedAt: new Date(),
          expiresAt: alert.expiresAt,
        },
      });
    }

    await recordProviderSuccess(provider.name, alertsFound, startedAt);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    await recordProviderFailure(provider.name, error, startedAt).catch(() => {});
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
        updatedAlerts: updatedCount,
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

  await expireStaleObservations();

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

async function expireStaleObservations() {
  const now = new Date();
  const expired = await prisma.alert.findMany({
    where: {
      status: { not: "resolved" },
      expiresAt: { lte: now },
    },
  });
  for (const alert of expired) {
    const resolved = await prisma.alert.update({
      where: { id: alert.id },
      data: { status: "resolved", resolvedAt: now },
    });
    alertEventBus.emit("alert:resolved", resolved);
  }
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

  const saved = await prisma.alert.upsert({
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
      signalKind: alert.signalKind ?? "incident",
      confidence: alert.confidence ?? "official",
      resolvedAt: alert.resolvedAt,
      expiresAt: alert.expiresAt,
      lastObservedAt: new Date(),
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
      signalKind: alert.signalKind ?? "incident",
      confidence: alert.confidence ?? "official",
      resolvedAt: alert.resolvedAt,
      expiresAt: alert.expiresAt,
      lastObservedAt: new Date(),
      metadata: metadataJson,
      ...(previousSeverity !== undefined
        ? { previousSeverity }
        : {}),
    },
  });

  await syncAlertUpdates(saved.id, alert.metadata);
  return saved;
}

async function syncAlertUpdates(
  alertId: string,
  metadata: Record<string, unknown> | undefined,
) {
  const updates = metadata?.updates;
  if (!Array.isArray(updates)) return;

  for (const value of updates) {
    if (!value || typeof value !== "object") continue;
    const update = value as Record<string, unknown>;
    if (typeof update.body !== "string" || typeof update.timestamp !== "string") {
      continue;
    }
    const sourceTimestamp = new Date(update.timestamp);
    if (Number.isNaN(sourceTimestamp.getTime())) continue;
    await prisma.alertUpdate.upsert({
      where: {
        alertId_sourceTimestamp_body: {
          alertId,
          sourceTimestamp,
          body: update.body,
        },
      },
      create: {
        alertId,
        sourceTimestamp,
        body: update.body,
        status: typeof update.status === "string" ? update.status : null,
      },
      update: {
        status: typeof update.status === "string" ? update.status : null,
      },
    });
  }
}

async function recordProviderSuccess(
  provider: string,
  alertCount: number,
  attemptedAt: Date,
) {
  await prisma.providerState.upsert({
    where: { provider },
    create: {
      provider,
      lastAttemptAt: attemptedAt,
      lastSuccessAt: new Date(),
      lastAlertCount: alertCount,
    },
    update: {
      lastAttemptAt: attemptedAt,
      lastSuccessAt: new Date(),
      lastError: null,
      consecutiveFailures: 0,
      lastAlertCount: alertCount,
    },
  });
}

async function recordProviderFailure(
  provider: string,
  error: string,
  attemptedAt: Date,
) {
  const existing = await prisma.providerState.findUnique({
    where: { provider },
    select: { consecutiveFailures: true },
  });
  await prisma.providerState.upsert({
    where: { provider },
    create: {
      provider,
      lastAttemptAt: attemptedAt,
      lastErrorAt: new Date(),
      lastError: error,
      consecutiveFailures: 1,
    },
    update: {
      lastAttemptAt: attemptedAt,
      lastErrorAt: new Date(),
      lastError: error,
      consecutiveFailures: (existing?.consecutiveFailures ?? 0) + 1,
    },
  });
}
