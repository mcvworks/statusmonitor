import { prisma } from "@/lib/db";
import type { AlertInput } from "@/lib/providers/types";

export interface DedupResult {
  new: AlertInput[];
  updated: AlertInput[];
  unchanged: AlertInput[];
}

function normalizeMetadata(metadata: Record<string, unknown> | undefined): string | null {
  return metadata ? JSON.stringify(metadata) : null;
}

function sameDate(a: Date | string | null | undefined, b: Date | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return new Date(a).getTime() === b.getTime();
}

/**
 * Compare incoming alerts against the database.
 * - "new" = no existing row with matching [source, externalId]
 * - "updated" = existing row but status or severity changed
 */
export async function deduplicateAlerts(
  incoming: AlertInput[],
): Promise<DedupResult> {
  if (incoming.length === 0) {
    return { new: [], updated: [], unchanged: [] };
  }

  // Fetch all existing alerts for these source+externalId pairs
  const existing = await prisma.alert.findMany({
    where: {
      OR: incoming.map((a) => ({
        source: a.source,
        externalId: a.externalId,
      })),
    },
    select: {
      source: true,
      externalId: true,
      status: true,
      severity: true,
      title: true,
      description: true,
      url: true,
      region: true,
      metadata: true,
      resolvedAt: true,
      signalKind: true,
      confidence: true,
    },
  });

  const existingMap = new Map(
    existing.map((a) => [`${a.source}:${a.externalId}`, a]),
  );

  const result: DedupResult = { new: [], updated: [], unchanged: [] };

  for (const alert of incoming) {
    const key = `${alert.source}:${alert.externalId}`;
    const prev = existingMap.get(key);

    if (!prev) {
      result.new.push(alert);
    } else if (
      prev.status !== alert.status ||
      prev.severity !== alert.severity ||
      prev.title !== alert.title ||
      prev.description !== (alert.description ?? null) ||
      prev.url !== (alert.url ?? null) ||
      prev.region !== (alert.region ?? null) ||
      prev.metadata !== normalizeMetadata(alert.metadata) ||
      !sameDate(alert.resolvedAt, prev.resolvedAt) ||
      prev.signalKind !== (alert.signalKind ?? "incident") ||
      prev.confidence !== (alert.confidence ?? "official")
    ) {
      result.updated.push(alert);
    } else {
      result.unchanged.push(alert);
    }
  }

  return result;
}
