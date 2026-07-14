import { NextResponse } from "next/server";
import { getSecurityEvents, SECURITY_KIND_LABELS } from "@/lib/security";

export const dynamic = "force-dynamic";
const BASE_URL = "https://monitor.ducktyped.xyz";

export async function GET() {
  const events = await getSecurityEvents(100);
  return NextResponse.json({
    version: "https://jsonfeed.org/version/1.1",
    title: "DTMonitor Security Intelligence",
    home_page_url: `${BASE_URL}/security`,
    feed_url: `${BASE_URL}/security/feed.json`,
    description: "Evidence-based cybersecurity events, exploited vulnerabilities, breaches, ransomware, and malware campaigns.",
    items: events.map(({ alert, kind, exploitationState, riskScore, action }) => ({
      id: `${BASE_URL}/security/event/${alert.id}`,
      url: `${BASE_URL}/security/event/${alert.id}`,
      ...(alert.url ? { external_url: alert.url } : {}),
      title: alert.title,
      content_text: [alert.description ?? "", `Type: ${SECURITY_KIND_LABELS[kind]} · Exploitation: ${exploitationState} · Risk: ${riskScore}/100`, action ? `Recommended action: ${action}` : ""].filter(Boolean).join("\n\n"),
      date_published: alert.timestamp.toISOString(),
      date_modified: alert.updatedAt.toISOString(),
      tags: [kind, alert.severity, exploitationState, alert.source],
    })),
  }, { headers: { "Content-Type": "application/feed+json; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}

