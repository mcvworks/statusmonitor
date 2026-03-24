import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PROVIDERS } from "@/lib/constants";

export async function GET() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const alerts = await prisma.alert.findMany({
    where: { timestamp: { gte: sevenDaysAgo } },
    select: { source: true, timestamp: true },
  });

  // Build per-provider daily counts for last 7 days
  const activity: Record<string, number[]> = {};

  // Initialize all providers with zeros
  for (const key of Object.keys(PROVIDERS)) {
    activity[key] = Array(7).fill(0);
  }

  for (const alert of alerts) {
    const dayIndex = Math.floor(
      (now.getTime() - new Date(alert.timestamp).getTime()) / (24 * 60 * 60 * 1000),
    );
    // dayIndex 0 = today, 6 = 7 days ago; we store oldest-first so reverse
    const idx = 6 - Math.min(dayIndex, 6);
    if (activity[alert.source]) {
      activity[alert.source][idx]++;
    }
  }

  return NextResponse.json(activity);
}
