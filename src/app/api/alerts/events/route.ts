import { NextRequest, NextResponse } from "next/server";
import { eventRingBuffer } from "@/lib/polling/event-ring-buffer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10), 1), 100);

  const events = eventRingBuffer.getRecent(limit);

  return NextResponse.json({ events });
}
