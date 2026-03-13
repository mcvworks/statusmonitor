import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: [{ status: "asc" }, { timestamp: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.alert.count({ where }),
  ]);

  return NextResponse.json({
    alerts,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  });
}
