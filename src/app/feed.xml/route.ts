import { NextRequest } from "next/server";
import {
  FEED_BASE_URL,
  feedQueryString,
  feedTitle,
  getFeedAlerts,
  parseFeedFilters,
  providerName,
} from "@/lib/feed";

export const dynamic = "force-dynamic";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const filters = parseFeedFilters(request.nextUrl.searchParams);
  const alerts = await getFeedAlerts(filters);
  const selfUrl = `${FEED_BASE_URL}/feed.xml${feedQueryString(filters)}`;

  const items = alerts
    .map((a) => {
      const url = `${FEED_BASE_URL}/incident/${a.id}`;
      const title = `${providerName(a.source)}: ${a.title}`;
      const desc = [
        a.description ?? "",
        `Severity: ${a.severity} · Status: ${a.status}`,
        a.url ? `Official source: ${a.url}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${a.timestamp.toUTCString()}</pubDate>
      <category>${xmlEscape(a.category)}</category>
      <category>${xmlEscape(a.severity)}</category>
      <description>${xmlEscape(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(feedTitle(filters))}</title>
    <link>${FEED_BASE_URL}</link>
    <description>Live IT service alerts: cloud outages, SaaS incidents, security advisories, and ISP issues — monitored by DTMonitor, a duckTyped project.</description>
    <language>en</language>
    <lastBuildDate>${(alerts[0]?.timestamp ?? new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
