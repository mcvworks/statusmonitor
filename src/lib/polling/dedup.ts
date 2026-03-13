import { prisma } from "@/lib/db";
import type { AlertInput } from "@/lib/providers/types";

export interface DedupResult {
  new: AlertInput[];
  updated: AlertInput[];
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
    return { new: [], updated: [] };
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
    },
  });

  const existingMap = new Map(
    existing.map((a) => [`${a.source}:${a.externalId}`, a]),
  );

  const result: DedupResult = { new: [], updated: [] };

  for (const alert of incoming) {
    const key = `${alert.source}:${alert.externalId}`;
    const prev = existingMap.get(key);

    if (!prev) {
      result.new.push(alert);
    } else if (prev.status !== alert.status || prev.severity !== alert.severity) {
      result.updated.push(alert);
    }
    // Otherwise identical — skip
  }

  return result;
}
