import { NextResponse } from "next/server";
import { getTimedDashboardSummary } from "@/lib/dashboard-summary";
import { DASHBOARD_SERVED_AT_HEADER } from "@/lib/dashboard-summary-clock";

export const dynamic = "force-dynamic";

// Read-only snapshot of the homepage summary. A failure returns 503 so a
// client can never mistake it for a confirmed zero.
export async function GET() {
  try {
    const { summary, servedAt } = await getTimedDashboardSummary();
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store",
        [DASHBOARD_SERVED_AT_HEADER]: String(servedAt),
      },
    });
  } catch (error) {
    console.error("Dashboard summary failed", error);
    return NextResponse.json({ error: "Summary unavailable" }, { status: 503 });
  }
}
