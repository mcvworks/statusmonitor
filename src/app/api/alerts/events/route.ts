import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import type { AlertEvent } from "@/lib/polling/event-ring-buffer";

export const dynamic = "force-dynamic";

// The feed is derived from alert history in the DB rather than the
// in-memory ring buffer: the buffer resets on every deploy/restart,
// which left this feed empty until the pollers observed new changes.
// Real-time updates still stream in over SSE on the client.
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10), 1), 100);
  const source = request.nextUrl.searchParams.get("source");
  const sourceWhere = source ? { source } : {};

  const eventFields = {
    id: true,
    source: true,
    title: true,
    severity: true,
    previousSeverity: true,
  } as const;

  const [created, resolved, severityChanged] = await Promise.all([
    prisma.alert.findMany({
      where: sourceWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { ...eventFields, createdAt: true },
    }),
    prisma.alert.findMany({
      where: { ...sourceWhere, resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
      take: limit,
      select: { ...eventFields, resolvedAt: true },
    }),
    // Escalations/de-escalations on incidents that are still open —
    // for resolved ones updatedAt reflects the resolution, not the
    // severity change, so the timestamp would be misleading
    prisma.alert.findMany({
      where: {
        ...sourceWhere,
        previousSeverity: { not: null },
        status: { not: "resolved" },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { ...eventFields, updatedAt: true },
    }),
  ]);

  const events: AlertEvent[] = [];

  for (const a of created) {
    events.push({
      type: "new",
      alertId: a.id,
      source: a.source,
      title: a.title,
      severity: a.severity,
      previousSeverity: a.previousSeverity,
      timestamp: a.createdAt.toISOString(),
    });
  }

  for (const a of resolved) {
    events.push({
      type: "resolved",
      alertId: a.id,
      source: a.source,
      title: a.title,
      severity: a.severity,
      previousSeverity: a.previousSeverity,
      timestamp: a.resolvedAt!.toISOString(),
    });
  }

  for (const a of severityChanged) {
    if (!a.previousSeverity || a.previousSeverity === a.severity) continue;
    const currentRank = SEVERITY_ORDER[a.severity as AlertSeverity] ?? 3;
    const prevRank = SEVERITY_ORDER[a.previousSeverity as AlertSeverity] ?? 3;
    events.push({
      type: currentRank < prevRank ? "escalated" : "de-escalated",
      alertId: a.id,
      source: a.source,
      title: a.title,
      severity: a.severity,
      previousSeverity: a.previousSeverity,
      timestamp: a.updatedAt.toISOString(),
    });
  }

  // Chronological ascending, newest at the end — same contract as the
  // old ring-buffer response (the feed auto-scrolls to the bottom)
  events.sort((x, y) => x.timestamp.localeCompare(y.timestamp));

  return NextResponse.json({ events: events.slice(-limit) });
}
