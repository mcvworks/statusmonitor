import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AlertCategory, AlertSeverity, AlertStatus } from "@/lib/alert-schema";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const category = params.get("category");
  const severity = params.get("severity");
  const source = params.get("source");
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const sort = params.get("sort") ?? "timestamp";
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(parseInt(params.get("page") ?? "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(params.get("limit") ?? "50", 10), 1),
    200,
  );
  const offset = (page - 1) * limit;

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

  // Date range filter
  if (startDate || endDate) {
    const timestampFilter: Record<string, Date> = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) timestampFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Include the full end day
        end.setHours(23, 59, 59, 999);
        timestampFilter.lte = end;
      }
    }
    if (Object.keys(timestampFilter).length > 0) {
      where.timestamp = timestampFilter;
    }
  }

  // Validate sort field
  const allowedSorts = [
    "timestamp",
    "severity",
    "source",
    "status",
    "resolvedAt",
  ];
  const sortField = allowedSorts.includes(sort) ? sort : "timestamp";

  const [alerts, total, stats] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { [sortField]: order },
      take: limit,
      skip: offset,
    }),
    prisma.alert.count({ where }),
    computeStats(where),
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    alerts,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
    stats,
  });
}

async function computeStats(where: Record<string, unknown>) {
  const [totalIncidents, bySeverity, resolved, topSources] = await Promise.all([
    prisma.alert.count({ where }),
    prisma.alert.groupBy({
      by: ["severity"],
      where,
      _count: true,
    }),
    prisma.alert.findMany({
      where: { ...where, status: "resolved", resolvedAt: { not: null } },
      select: { timestamp: true, resolvedAt: true },
    }),
    prisma.alert.groupBy({
      by: ["source"],
      where,
      _count: true,
      orderBy: { _count: { source: "desc" } },
      take: 5,
    }),
  ]);

  // Average resolution time in minutes
  let avgResolutionMs = 0;
  if (resolved.length > 0) {
    const totalMs = resolved.reduce((sum, a) => {
      const start = new Date(a.timestamp).getTime();
      const end = new Date(a.resolvedAt!).getTime();
      return sum + (end - start);
    }, 0);
    avgResolutionMs = totalMs / resolved.length;
  }

  const severityBreakdown: Record<string, number> = {};
  for (const row of bySeverity) {
    severityBreakdown[row.severity] = row._count;
  }

  return {
    totalIncidents,
    avgResolutionMinutes: Math.round(avgResolutionMs / 60_000),
    severityBreakdown,
    topSources: topSources.map((s) => ({
      source: s.source,
      count: s._count,
    })),
  };
}
