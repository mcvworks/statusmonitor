import type { Metadata } from "next";
import Link from "next/link";
import { Bug, DatabaseZap, Rss, ShieldAlert, Siren } from "lucide-react";
import { SecurityEventCard } from "@/components/security/SecurityEventCard";
import {
  getSecurityEvents,
  SECURITY_KIND_LABELS,
  SECURITY_KINDS,
  type SecurityKind,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cybersecurity Events, Exploited Vulnerabilities & Threat Intelligence",
  description:
    "Track actively exploited vulnerabilities, major breaches, ransomware, malware campaigns, and supply-chain security events with evidence and remediation guidance.",
  alternates: {
    canonical: "https://monitor.ducktyped.xyz/security",
    types: {
      "application/rss+xml": [{ url: "/security/feed.xml", title: "DTMonitor Security Intelligence" }],
      "application/feed+json": [{ url: "/security/feed.json", title: "DTMonitor Security Intelligence" }],
    },
  },
};

type SearchParams = Promise<{ kind?: string; severity?: string; q?: string }>;

export default async function SecurityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const selectedKind = SECURITY_KINDS.includes(params.kind as SecurityKind)
    ? (params.kind as SecurityKind)
    : null;
  const selectedSeverity = ["critical", "major", "minor", "info"].includes(params.severity ?? "")
    ? params.severity
    : null;
  const query = params.q?.trim().toLowerCase() ?? "";
  const allEvents = await getSecurityEvents(300);
  const events = allEvents.filter((event) => {
    if (selectedKind && event.kind !== selectedKind) return false;
    if (selectedSeverity && event.alert.severity !== selectedSeverity) return false;
    if (query) {
      const haystack = `${event.alert.title} ${event.alert.description ?? ""} ${event.vendor ?? ""} ${event.product ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const activelyExploited = allEvents.filter((event) => event.exploitationState === "active").length;
  const ransomware = allEvents.filter((event) => event.ransomwareUse).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "DTMonitor Security Intelligence",
    url: "https://monitor.ducktyped.xyz/security",
    description: metadata.description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.slice(0, 50).map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: event.alert.title,
        url: `https://monitor.ducktyped.xyz/security/event/${event.alert.id}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="glass-card corner-brackets relative overflow-hidden p-6 lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-critical">
            Security intelligence
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary lg:text-3xl">
            Major Cybersecurity Events &amp; Exploited Vulnerabilities
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            A separate evidence-based feed for exploited vulnerabilities, breaches, ransomware,
            malware campaigns, and supply-chain attacks. Official confirmation is kept distinct
            from emerging signals.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/security/feed.xml" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:border-primary/30 hover:text-primary">
              <Rss className="h-3.5 w-3.5" /> Security RSS
            </a>
            <a href="/security/feed.json" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:border-primary/30 hover:text-primary">
              <DatabaseZap className="h-3.5 w-3.5" /> JSON Feed
            </a>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Security intelligence summary">
        <Fact icon={<ShieldAlert className="h-4 w-4 text-critical" />} label="Tracked events" value={allEvents.length} />
        <Fact icon={<Siren className="h-4 w-4 text-major" />} label="Exploited now" value={activelyExploited} />
        <Fact icon={<Bug className="h-4 w-4 text-minor" />} label="Ransomware-linked" value={ransomware} />
      </section>

      <section className="glass-card p-4" aria-label="Filter security intelligence">
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" action="/security">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search CVE, vendor, product, or event…" className="rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/50" />
          <select name="kind" defaultValue={selectedKind ?? ""} className="rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-secondary">
            <option value="">All event types</option>
            {SECURITY_KINDS.map((kind) => <option key={kind} value={kind}>{SECURITY_KIND_LABELS[kind]}</option>)}
          </select>
          <select name="severity" defaultValue={selectedSeverity ?? ""} className="rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-secondary">
            <option value="">All severities</option>
            <option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option><option value="info">Info</option>
          </select>
          <div className="flex gap-2 md:col-span-3">
            <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-black">Apply filters</button>
            {(selectedKind || selectedSeverity || query) && <Link href="/security" className="rounded-lg border border-border px-4 py-2 text-xs text-text-secondary">Clear</Link>}
          </div>
        </form>
      </section>

      <div className="flex items-end justify-between gap-3">
        <div><p className="section-label">Ranked intelligence</p><p className="mt-1 text-xs text-text-muted">Exploitation and evidence weigh more heavily than CVSS alone.</p></div>
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">{events.length} result{events.length === 1 ? "" : "s"}</span>
      </div>

      {events.length ? (
        <div className="space-y-4">{events.map((event) => <SecurityEventCard key={event.alert.id} event={event} />)}</div>
      ) : (
        <div className="glass-card p-10 text-center"><p className="text-sm font-medium text-text-primary">No matching security events</p><p className="mt-1 text-xs text-text-muted">Some categories are ready for the breach and malware collectors that come next.</p></div>
      )}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="glass-card flex items-center gap-3 p-4"><div className="rounded-lg bg-surface-input p-2">{icon}</div><div><p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">{label}</p><p className="text-xl font-semibold text-text-primary">{value}</p></div></div>;
}
