import { prisma } from "@/lib/db";

/**
 * Server snapshot behind the homepage summary. Counts come straight from the
 * database, so they do not depend on the alert feed's page limit or on any
 * filter a visitor has applied.
 */
export interface DashboardSummary {
  /** Unresolved official incidents plus observed internet outages. */
  activeCount: number;
  /** Unresolved advisories. Never included in activeCount. */
  securityCount: number;
  /** ISO time of the last completed poll, or null if none has completed. */
  lastPollAt: string | null;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [activeCount, securityCount, lastPoll] = await Promise.all([
    prisma.alert.count({
      where: {
        status: { not: "resolved" },
        signalKind: { in: ["incident", "internet_outage"] },
      },
    }),
    prisma.alert.count({
      where: { signalKind: "advisory", status: { not: "resolved" } },
    }),
    prisma.pollLog.findFirst({
      orderBy: { completedAt: "desc" },
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  return {
    activeCount,
    securityCount,
    lastPollAt: lastPoll?.completedAt?.toISOString() ?? null,
  };
}
