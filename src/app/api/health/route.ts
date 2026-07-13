import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllProviders } from "@/lib/providers/registry";

const startedAt = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const uptime = Math.floor((Date.now() - startedAt) / 1000);
  const version = process.env.npm_package_version ?? "0.1.0";

  // Check DB connectivity
  let dbConnected = false;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbConnected = true;
  } catch {
    // DB unreachable
  }

  // Provider health from durable source state. This distinguishes a successful
  // empty result from an unreachable or stale source.
  const providerHealth = {
    total: getAllProviders().length,
    healthy: 0,
    errored: 0,
    stale: 0,
    notConfigured: 0,
  };
  let lastPoll: string | null = null;
  try {
    const states = await prisma.providerState.findMany();
    const byProvider = new Map(states.map((state) => [state.provider, state]));
    const attempts = states
      .map((state) => state.lastAttemptAt)
      .sort((a, b) => b.getTime() - a.getTime());
    lastPoll = attempts[0]?.toISOString() ?? null;

    for (const provider of getAllProviders()) {
      const state = byProvider.get(provider.name);
      if (!state) {
        providerHealth.stale++;
        continue;
      }
      if (state.lastError?.toLowerCase().includes("not configured")) {
        providerHealth.notConfigured++;
        continue;
      }
      const freshnessWindow = Math.max(
        provider.pollInterval === "fast" ? 6 * 60_000 : 15 * 60_000,
        (provider.minimumIntervalMs ?? 0) * 1.5,
      );
      if (
        !state.lastSuccessAt ||
        Date.now() - state.lastSuccessAt.getTime() > freshnessWindow
      ) {
        providerHealth.stale++;
      } else if (state.consecutiveFailures > 0) {
        providerHealth.errored++;
      } else {
        providerHealth.healthy++;
      }
    }
  } catch {
    providerHealth.stale = providerHealth.total;
  }

  const sourcesHealthy =
    providerHealth.errored === 0 && providerHealth.stale === 0;
  const status = dbConnected && sourcesHealthy ? "ok" : "degraded";

  const body = {
    status,
    uptime,
    version,
    providers: providerHealth,
    lastPoll,
    dbConnected,
  };

  // Provider degradation is reported in the body but does not fail the
  // liveness probe. Database failure does.
  return NextResponse.json(body, { status: dbConnected ? 200 : 503 });
}
