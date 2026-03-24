import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AlertCategory, AlertSeverity, AlertStatus } from "@/lib/alert-schema";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const category = params.get("category");
  const severity = params.get("severity");
  const source = params.get("source");
  const status = params.get("status");
  const limit = Math.min(parseInt(params.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(params.get("offset") ?? "0", 10), 0);

  const where: Record<string, unknown> = {};

  if (category && AlertCategory.safeParse(category).success) {
    where.category = category;
  }
  if (severity && AlertSeverity.safeParse(severity).success) {
    where.severity = severity;
  }
  if (source) {
    where.source = source;
  }
  if (status && AlertStatus.safeParse(status).success) {
    where.status = status;
  }

  // Include user alert states when authenticated
  const session = await auth();
  const userId = session?.user?.id;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: [{ status: "asc" }, { timestamp: "desc" }],
      take: limit,
      skip: offset,
      ...(userId
        ? {
            include: {
              alertStates: {
                where: { userId },
                select: { state: true, snoozedUntil: true },
              },
            },
          }
        : {}),
    }),
    prisma.alert.count({ where }),
  ]);

  // Compute per-source average resolution time for active sources
  const activeSources = [...new Set(alerts.map((a) => a.source))];
  const resolutionStats =
    activeSources.length > 0
      ? await prisma.alert.findMany({
          where: {
            source: { in: activeSources },
            status: "resolved",
            resolvedAt: { not: null },
          },
          select: { source: true, timestamp: true, resolvedAt: true },
        })
      : [];

  const avgResolutionBySource: Record<string, number> = {};
  const grouped: Record<string, { total: number; count: number }> = {};
  for (const r of resolutionStats) {
    const ms =
      new Date(r.resolvedAt!).getTime() - new Date(r.timestamp).getTime();
    if (!grouped[r.source]) grouped[r.source] = { total: 0, count: 0 };
    grouped[r.source].total += ms;
    grouped[r.source].count += 1;
  }
  for (const [source, { total: totalMs, count }] of Object.entries(grouped)) {
    avgResolutionBySource[source] = Math.round(totalMs / count / 60_000);
  }

  // Flatten alertStates array into a single userState field; parse metadata JSON
  const serialized = alerts.map((alert) => {
    const { alertStates, metadata, ...rest } = alert as typeof alert & {
      alertStates?: { state: string; snoozedUntil: Date | null }[];
    };
    const userState = alertStates?.[0] ?? null;
    let parsedMetadata: Record<string, unknown> | null = null;
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        // ignore malformed metadata
      }
    }
    return {
      ...rest,
      metadata: parsedMetadata,
      userState: userState
        ? {
            state: userState.state as "acknowledged" | "snoozed" | "dismissed",
            snoozedUntil: userState.snoozedUntil?.toISOString() ?? null,
          }
        : null,
    };
  });

  return NextResponse.json({
    alerts: serialized,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    avgResolutionBySource,
  });
}
