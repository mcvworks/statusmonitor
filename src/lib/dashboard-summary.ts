import { prisma } from "@/lib/db";
import { PROVIDERS } from "@/lib/constants";
import { getProvider } from "@/lib/providers/registry";
import {
  buildDashboardSummary,
  CURRENT_INCIDENT_WINDOW_DAYS,
  VERIFY_TOLERANCE_MS,
  type DashboardSummary,
  type SummarySourceInput,
} from "@/lib/dashboard-snapshot";

export type { DashboardSummary } from "@/lib/dashboard-snapshot";

const DAY_MS = 24 * 60 * 60_000;
/** Many visitors refresh on the same live event; share one read between them. */
const SHARE_MS = 2_000;

let shared: { at: number; summary: Promise<DashboardSummary> } | null = null;

/**
 * Server snapshot behind the homepage summary. Everything is read straight
 * from the database, so it does not depend on the alert feed's page limit or
 * on any filter a visitor has applied. The counting rules live in
 * dashboard-snapshot.ts.
 */
export function getDashboardSummary(): Promise<DashboardSummary> {
  const now = Date.now();
  if (shared && now - shared.at < SHARE_MS) return shared.summary;

  const summary = readDashboardSummary();
  shared = { at: now, summary };
  // A failed read must never be handed to the next caller.
  summary.catch(() => {
    if (shared?.summary === summary) shared = null;
  });
  return summary;
}

async function readDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const states = await prisma.providerState.findMany({
    select: {
      provider: true,
      lastSuccessAt: true,
      lastError: true,
      consecutiveFailures: true,
    },
  });
  const stateByProvider = new Map(states.map((state) => [state.provider, state]));

  // Same freshness windows as /api/providers/health. A source listed in the
  // registry without an adapter has no window and can never count as fresh.
  const sources: SummarySourceInput[] = Object.entries(PROVIDERS).map(
    ([key, meta]) => {
      const adapter = getProvider(key);
      return {
        key,
        category: meta.category,
        freshnessWindowMs: adapter
          ? Math.max(
              adapter.pollInterval === "fast" ? 6 * 60_000 : 15 * 60_000,
              (adapter.minimumIntervalMs ?? 0) * 1.5,
            )
          : null,
        state: stateByProvider.get(key) ?? null,
      };
    },
  );

  // Only records a source still listed at its latest successful check can
  // describe the present, so nothing older is read.
  const listedAtLastCheck = sources.flatMap((source) =>
    source.state?.lastSuccessAt
      ? [
          {
            source: source.key,
            lastObservedAt: {
              gte: new Date(
                source.state.lastSuccessAt.getTime() - VERIFY_TOLERANCE_MS,
              ),
            },
          },
        ]
      : [],
  );

  const advisoryWhere = { signalKind: "advisory", status: { not: "resolved" } };
  const [openAlerts, advisoriesOpen, advisoriesRecent] = await Promise.all([
    listedAtLastCheck.length === 0
      ? []
      : prisma.alert.findMany({
          where: {
            status: { not: "resolved" },
            signalKind: {
              in: ["incident", "internet_outage", "community_signal"],
            },
            OR: listedAtLastCheck,
          },
          select: {
            id: true,
            source: true,
            title: true,
            severity: true,
            status: true,
            signalKind: true,
            confidence: true,
            timestamp: true,
            lastObservedAt: true,
            updates: {
              select: { sourceTimestamp: true },
              orderBy: { sourceTimestamp: "desc" },
              take: 1,
            },
          },
        }),
    prisma.alert.count({ where: advisoryWhere }),
    prisma.alert.count({
      where: {
        ...advisoryWhere,
        timestamp: {
          gte: new Date(now.getTime() - CURRENT_INCIDENT_WINDOW_DAYS * DAY_MS),
        },
      },
    }),
  ]);

  return buildDashboardSummary({
    now,
    sources,
    openAlerts: openAlerts.map(({ updates, ...alert }) => ({
      ...alert,
      lastUpdateAt: updates[0]?.sourceTimestamp ?? null,
    })),
    advisoriesOpen,
    advisoriesRecent,
  });
}
