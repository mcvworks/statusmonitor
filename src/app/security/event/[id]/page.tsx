import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck, Siren } from "lucide-react";
import { prisma } from "@/lib/db";
import { SECURITY_KIND_LABELS, toSecurityEvent } from "@/lib/security";
import { PROVIDERS, SEVERITY_COLORS } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { CvssBreakdown } from "@/components/dashboard/CvssBreakdown";
import { ShareMenu } from "@/components/sharing/ShareMenu";

const BASE_URL = "https://monitor.ducktyped.xyz";
const getAlert = cache((id: string) => prisma.alert.findFirst({ where: { id, category: "security" } }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const alert = await getAlert(id);
  if (!alert) return { title: "Security event not found" };
  const description = alert.description?.slice(0, 160) ?? `Security intelligence and remediation details for ${alert.title}.`;
  return {
    title: alert.title,
    description,
    alternates: { canonical: `${BASE_URL}/security/event/${alert.id}` },
    openGraph: { type: "article", title: alert.title, description, url: `${BASE_URL}/security/event/${alert.id}` },
  };
}

export default async function SecurityEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const alert = await getAlert(id);
  if (!alert) notFound();
  const event = toSecurityEvent(alert);
  const sourceName = PROVIDERS[alert.source]?.name ?? alert.source;
  const cvss = event.metadata.cvss as React.ComponentProps<typeof CvssBreakdown>["cvss"] | undefined;
  const pageUrl = `${BASE_URL}/security/event/${alert.id}`;
  const color = SEVERITY_COLORS[alert.severity as AlertSeverity]?.fg;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: alert.title,
    description: alert.description,
    datePublished: alert.timestamp.toISOString(),
    dateModified: alert.updatedAt.toISOString(),
    url: pageUrl,
    author: { "@type": "Organization", name: sourceName, url: alert.url ?? PROVIDERS[alert.source]?.statusUrl },
    publisher: { "@type": "Organization", name: "DTMonitor", url: BASE_URL },
  };

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/security" className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] text-text-muted hover:text-primary">
        <ArrowLeft className="h-3 w-3" /> Security intelligence
      </Link>

      <header className="glass-card corner-brackets p-5 lg:p-7" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity as AlertSeverity} />
          <span className="rounded-full border border-border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">{SECURITY_KIND_LABELS[event.kind]}</span>
          {event.exploitationState === "active" && <span className="inline-flex items-center gap-1 rounded-full bg-critical/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-critical"><Siren className="h-3 w-3" /> Active exploitation</span>}
          <div className="ml-auto"><ShareMenu url={pageUrl} title={alert.title} text={`${SECURITY_KIND_LABELS[event.kind]} — ${alert.title}`} /></div>
        </div>
        <h1 className="mt-4 text-xl font-semibold leading-snug text-text-primary lg:text-2xl">{alert.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          <span className="inline-flex items-center gap-1 text-secondary"><ShieldCheck className="h-3 w-3" /> {sourceName} · {alert.confidence}</span>
          <span>Published {alert.timestamp.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}</span>
          <span>Risk {event.riskScore}/100</span>
          {event.epssProbability !== null && <span>EPSS {(event.epssProbability * 100).toFixed(1)}%</span>}
        </div>
        {alert.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-text-secondary">{alert.description}</p>}
      </header>

      {event.action && <section className="glass-card p-5" aria-labelledby="recommended-action"><p className="section-label text-primary">Recommended action</p><h2 id="recommended-action" className="sr-only">Recommended action</h2><p className="mt-2 text-sm leading-6 text-text-primary">{event.action}</p>{typeof event.metadata.dueDate === "string" && <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">CISA remediation due: {event.metadata.dueDate}</p>}</section>}

      {(event.vendor || event.product || cvss) && <section className="glass-card p-5"><h2 className="section-label">Technical details</h2>{(event.vendor || event.product) && <dl className="mt-3 grid gap-3 sm:grid-cols-2"><Fact label="Vendor" value={event.vendor ?? "Not specified"} /><Fact label="Product" value={event.product ?? "Not specified"} /><Fact label="Exploitation" value={event.exploitationState.replace("-", " ")} /><Fact label="Evidence" value={alert.confidence} /></dl>}{cvss && <CvssBreakdown cvss={cvss} />}</section>}

      <section className="glass-card p-5"><h2 className="section-label">Evidence and sources</h2><p className="mt-2 text-sm leading-6 text-text-secondary">This record is attributed to {sourceName}. Exploitation status and remediation guidance are kept separate from the vulnerability&apos;s technical severity.</p>{alert.url && <a href={alert.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">Open primary source <ExternalLink className="h-3 w-3" /></a>}</section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">{label}</dt><dd className="mt-1 text-sm capitalize text-text-primary">{value}</dd></div>;
}

