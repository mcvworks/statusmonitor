import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard-summary";

export const dynamic = "force-dynamic";

// Read-only snapshot of the homepage summary. A failure returns 503 so a
// client can never mistake it for a confirmed zero.
export async function GET() {
  try {
    return NextResponse.json(await getDashboardSummary(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Dashboard summary failed", error);
    return NextResponse.json({ error: "Summary unavailable" }, { status: 503 });
  }
}
