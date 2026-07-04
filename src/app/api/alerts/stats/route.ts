import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Per-provider reliability stats over the last 30 days
export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");
  if (!source || !PROVIDERS[source]) {
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }

  const now = Date.now();
  const windowStart = new Date(now - WINDOW_DAYS * DAY_MS);

  const [windowAlerts, lastAlert, resolvedAlerts] = await Promise.all([
    prisma.alert.findMany({
      where: { source, timestamp: { gte: windowStart } },
      select: { timestamp: true, severity: true },
    }),
    prisma.alert.findFirst({
      where: { source },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
    prisma.alert.findMany({
      where: { source, status: "resolved", resolvedAt: { not: null } },
      select: { timestamp: true, resolvedAt: true },
    }),
  ]);

  // Days in the window with zero alerts
  const daysWithAlerts = new Set<number>();
  let worstRank = Infinity;
  let worstSeverity: AlertSeverity | null = null;
  for (const a of windowAlerts) {
    daysWithAlerts.add(Math.floor((now - a.timestamp.getTime()) / DAY_MS));
    const rank = SEVERITY_ORDER[a.severity as AlertSeverity] ?? 3;
    if (rank < worstRank) {
      worstRank = rank;
      worstSeverity = a.severity as AlertSeverity;
    }
  }

  let avgResolutionMin: number | null = null;
  if (resolvedAlerts.length > 0) {
    const totalMs = resolvedAlerts.reduce(
      (sum, r) => sum + (r.resolvedAt!.getTime() - r.timestamp.getTime()),
      0,
    );
    avgResolutionMin = Math.round(totalMs / resolvedAlerts.length / 60_000);
  }

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    incidents: windowAlerts.length,
    quietDays: WINDOW_DAYS - daysWithAlerts.size,
    worstSeverity,
    avgResolutionMin,
    lastIncidentAt: lastAlert?.timestamp.toISOString() ?? null,
  });
}
