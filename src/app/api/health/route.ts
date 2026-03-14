import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRegisteredProviders } from "@/lib/polling/scheduler";

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

  // Provider health from recent PollLog entries (last 10 minutes)
  let providerHealth = { total: 0, healthy: 0, errored: 0 };
  let lastPoll: string | null = null;
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentPolls = await prisma.pollLog.findMany({
      where: { startedAt: { gte: tenMinAgo } },
      orderBy: { startedAt: "desc" },
    });

    if (recentPolls.length > 0) {
      lastPoll = recentPolls[0].startedAt.toISOString();
      const byProvider = new Map<string, boolean>();
      for (const poll of recentPolls) {
        if (!byProvider.has(poll.provider)) {
          byProvider.set(poll.provider, !poll.error);
        }
      }
      providerHealth = {
        total: byProvider.size,
        healthy: [...byProvider.values()].filter(Boolean).length,
        errored: [...byProvider.values()].filter((v) => !v).length,
      };
    } else {
      // Fallback to registered provider count
      providerHealth.total = getRegisteredProviders().length;
    }
  } catch {
    // PollLog query failed
  }

  const healthy = dbConnected;
  const status = healthy ? "ok" : "degraded";

  const body = {
    status,
    uptime,
    version,
    providers: providerHealth,
    lastPoll,
    dbConnected,
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
