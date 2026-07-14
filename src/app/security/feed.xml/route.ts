import { getSecurityEvents, SECURITY_KIND_LABELS } from "@/lib/security";

export const dynamic = "force-dynamic";
const BASE_URL = "https://monitor.ducktyped.xyz";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const events = await getSecurityEvents(100);
  const items = events.map(({ alert, kind, exploitationState, riskScore, action }) => {
    const url = `${BASE_URL}/security/event/${alert.id}`;
    const body = [alert.description ?? "", `Type: ${SECURITY_KIND_LABELS[kind]} · Exploitation: ${exploitationState} · Risk: ${riskScore}/100`, action ? `Recommended action: ${action}` : "", alert.url ? `Primary source: ${alert.url}` : ""].filter(Boolean).join("\n\n");
    return `<item><title>${escapeXml(alert.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${alert.timestamp.toUTCString()}</pubDate><category>${escapeXml(SECURITY_KIND_LABELS[kind])}</category><category>${alert.severity}</category><description>${escapeXml(body)}</description></item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>DTMonitor Security Intelligence</title><link>${BASE_URL}/security</link><description>Evidence-based cybersecurity events, exploited vulnerabilities, breaches, ransomware, and malware campaigns.</description><language>en</language><lastBuildDate>${(events[0]?.alert.timestamp ?? new Date()).toUTCString()}</lastBuildDate><atom:link href="${BASE_URL}/security/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}

