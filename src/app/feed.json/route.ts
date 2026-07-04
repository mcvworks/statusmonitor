import { NextRequest, NextResponse } from "next/server";
import {
  FEED_BASE_URL,
  feedQueryString,
  feedTitle,
  getFeedAlerts,
  parseFeedFilters,
  providerName,
} from "@/lib/feed";

export const dynamic = "force-dynamic";

// JSON Feed 1.1 — https://jsonfeed.org/version/1.1
export async function GET(request: NextRequest) {
  const filters = parseFeedFilters(request.nextUrl.searchParams);
  const alerts = await getFeedAlerts(filters);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: feedTitle(filters),
    home_page_url: FEED_BASE_URL,
    feed_url: `${FEED_BASE_URL}/feed.json${feedQueryString(filters)}`,
    description:
      "Live IT service alerts: cloud outages, SaaS incidents, security advisories, and ISP issues — monitored by DTMonitor, a duckTyped project.",
    items: alerts.map((a) => ({
      id: `${FEED_BASE_URL}/incident/${a.id}`,
      url: `${FEED_BASE_URL}/incident/${a.id}`,
      ...(a.url ? { external_url: a.url } : {}),
      title: `${providerName(a.source)}: ${a.title}`,
      content_text: [
        a.description ?? "",
        `Severity: ${a.severity} · Status: ${a.status}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      date_published: a.timestamp.toISOString(),
      ...(a.resolvedAt ? { date_modified: a.resolvedAt.toISOString() } : {}),
      tags: [a.source, a.category, a.severity],
    })),
  };

  return NextResponse.json(feed, {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
