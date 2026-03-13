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

  // Flatten alertStates array into a single userState field
  const serialized = alerts.map((alert) => {
    const { alertStates, ...rest } = alert as typeof alert & {
      alertStates?: { state: string; snoozedUntil: Date | null }[];
    };
    const userState = alertStates?.[0] ?? null;
    return {
      ...rest,
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
  });
}
