import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { PROVIDERS } from "@/lib/constants";
import { getProvider } from "@/lib/providers/registry";
import type { SummarySample } from "@/lib/dashboard-summary-clock";
import {
  buildDashboardSummary,
  RECENT_ADVISORY_WINDOW_DAYS,
  sourceRole,
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
function getSharedDashboardSummary(): Promise<DashboardSummary> {
  const now = Date.now();
  if (shared && now - shared.at < SHARE_MS) return shared.summary;

  const summary = prisma.$transaction(readDashboardSummary);
  shared = { at: now, summary };
  // A failed read must never be handed to the next caller.
  summary.catch(() => {
    if (shared?.summary === summary) shared = null;
  });
  return summary;
}

export async function getTimedDashboardSummary(): Promise<SummarySample> {
  const summary = await getSharedDashboardSummary();
  // Sample per request after the read, even when the snapshot was shared.
  return { summary, servedAt: Date.now(), requestStartedAt: null };
}

export async function readDashboardSummary(
  db: Prisma.TransactionClient,
  now = new Date(),
): Promise<DashboardSummary> {
  const states = await db.providerState.findMany({
    select: {
      provider: true,
      lastSuccessAt: true,
      lastAttemptAt: true,
      lastError: true,
      consecutiveFailures: true,
    },
  });
  const stateByProvider = new Map(states.map((state) => [state.provider, state]));

  // ProviderState records success after the alert writes, just before PollLog
  // records completion. Match that success to its completed, error-free run.
  const successfulAttempts = states.flatMap((state) =>
    state.lastSuccessAt
      ? [{
          provider: state.provider,
          startedAt: state.consecutiveFailures === 0
            ? state.lastAttemptAt
            : { lte: state.lastSuccessAt },
          completedAt: { gte: state.lastSuccessAt },
        }]
      : [],
  );
  const successfulPolls = successfulAttempts.length === 0
    ? []
    : await db.pollLog.findMany({
        where: { error: null, OR: successfulAttempts },
        orderBy: { startedAt: "desc" },
        select: { provider: true, startedAt: true, completedAt: true },
      });
  const pollByProvider = new Map<string, NonNullable<SummarySourceInput["successfulPoll"]>>();
  for (const { provider, startedAt, completedAt } of successfulPolls) {
    if (completedAt && !pollByProvider.has(provider)) {
      pollByProvider.set(provider, { startedAt, completedAt });
    }
  }

  // Ingestion can overwrite a record's previous observation before the new
  // poll is verified. Any newer observation makes the old interval incomplete,
  // including observations of resolved incidents and other signal kinds.
  const afterCompletion = Array.from(pollByProvider, ([source, poll]) => ({
    source,
    lastObservedAt: { gt: poll.completedAt },
  }));
  const unverifiedSources = new Set(
    afterCompletion.length === 0
      ? []
      : (await db.alert.groupBy({
          by: ["source"],
          where: { OR: afterCompletion },
        })).map(({ source }) => source),
  );

  // History endpoints and RSS/Atom feeds do not establish a complete open
  // set. Treat an omission as inconclusive unless the adapter guarantees it.
  const pollsWithInconclusiveOmissions = Array.from(pollByProvider).flatMap(([source, poll]) =>
    sourceRole(source, PROVIDERS[source]?.category) === "service" &&
      getProvider(source)?.openIncidentSetIsExhaustive !== true
      ? [{ source, lastObservedAt: { lt: poll.startedAt } }]
      : [],
  );
  const unexpired = { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
  const sourcesWithOmissions = new Set(
    pollsWithInconclusiveOmissions.length === 0
      ? []
      : (await db.alert.groupBy({
          by: ["source"],
          where: {
            signalKind: { in: ["incident", "internet_outage"] },
            status: { not: "resolved" },
            confidence: { not: "crowdsourced" },
            NOT: { signalKind: "incident", confidence: "observed" },
            AND: [unexpired],
            OR: pollsWithInconclusiveOmissions,
          },
        })).map(({ source }) => source),
  );

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
        successfulPoll: pollByProvider.get(key) ?? null,
        hasUnverifiedObservations: unverifiedSources.has(key),
        hasOmittedIncident: sourcesWithOmissions.has(key),
      };
    },
  );

  // Only records a source still listed at its latest successful check can
  // describe the present, so nothing older is read.
  const listedAtLastCheck = sources.flatMap(({ key, successfulPoll }) =>
    successfulPoll
      ? [{
          source: key,
          lastObservedAt: { gte: successfulPoll.startedAt, lte: successfulPoll.completedAt },
        }]
      : [],
  );

  const advisoryWhere = { signalKind: "advisory", status: { not: "resolved" } };
  const [lastPoll, openAlerts, advisoriesOpen, advisoriesRecent] = await Promise.all([
    db.pollLog.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
    listedAtLastCheck.length === 0
      ? []
      : db.alert.findMany({
          where: {
            status: { not: "resolved" },
            signalKind: {
              in: ["incident", "internet_outage", "community_signal"],
            },
            AND: [unexpired],
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
    db.alert.count({ where: advisoryWhere }),
    db.alert.count({
      where: {
        ...advisoryWhere,
        timestamp: {
          gte: new Date(now.getTime() - RECENT_ADVISORY_WINDOW_DAYS * DAY_MS),
        },
      },
    }),
  ]);

  return buildDashboardSummary({
    now,
    lastPollAt: lastPoll?.completedAt ?? null,
    sources,
    openAlerts: openAlerts.map(({ updates, ...alert }) => ({
      ...alert,
      lastUpdateAt: updates[0]?.sourceTimestamp ?? null,
    })),
    advisoriesOpen,
    advisoriesRecent,
  });
}
