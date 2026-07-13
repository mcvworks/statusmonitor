import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldAlert, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { PROVIDERS, CATEGORY_LABELS, SEVERITY_COLORS } from "@/lib/constants";
import type { AlertCategory, AlertSeverity } from "@/lib/alert-schema";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { ProviderIcon } from "@/components/dashboard/ProviderIcon";
import { IncidentTimeline } from "@/components/dashboard/IncidentTimeline";
import { CvssBreakdown } from "@/components/dashboard/CvssBreakdown";
import { ComponentChips } from "@/components/dashboard/ComponentChips";
import { CommunityThreads } from "@/components/dashboard/CommunityThreads";
import { BlastRadiusPanel } from "@/components/blast-radius/BlastRadiusPanel";
import { hasBlastRadius } from "@/lib/blast-radius";
import { ShareMenu } from "@/components/sharing/ShareMenu";

const BASE_URL = "https://monitor.ducktyped.xyz";
const INDEXABLE_SIGNAL_KINDS = new Set([
  "incident",
  "internet_outage",
  "maintenance",
]);

const getAlert = cache(async (id: string) => {
  return prisma.alert.findUnique({ where: { id } });
});

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    const m = minutes % 60;
    return m > 0 ? `${hours}h ${m}m` : `${hours}h`;
  }
  return `${Math.round(hours / 24)}d`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const alert = await getAlert(id);
  if (!alert) return { title: "Incident not found" };

  const providerName = PROVIDERS[alert.source]?.name ?? alert.source;
  // Root layout applies the "%s | DTMonitor" template
  const title = `${providerName}: ${alert.title}`;
  const description =
    alert.description?.slice(0, 160) ??
    `${providerName} ${alert.severity} incident tracked by DTMonitor. Status: ${alert.status}.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/incident/${alert.id}` },
    robots: {
      index: INDEXABLE_SIGNAL_KINDS.has(alert.signalKind),
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/incident/${alert.id}`,
      type: "article",
    },
  };
}

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alert = await getAlert(id);
  if (!alert) notFound();

  const provider = PROVIDERS[alert.source];
  const providerName = provider?.name ?? alert.source;
  const metadata = parseMetadata(alert.metadata);
  const isResolved = alert.status === "resolved";
  const severityColor = SEVERITY_COLORS[alert.severity as AlertSeverity];
  const durationMs =
    // eslint-disable-next-line react-hooks/purity -- server component rendered per-request; elapsed time is intentionally "as of now"
    (alert.resolvedAt ? alert.resolvedAt.getTime() : Date.now()) -
    alert.timestamp.getTime();
  const pageUrl = `${BASE_URL}/incident/${alert.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Report",
        name: `${providerName}: ${alert.title}`,
        description:
          alert.description ??
          `${providerName} incident status: ${alert.status}.`,
        url: pageUrl,
        datePublished: alert.timestamp.toISOString(),
        dateModified: alert.updatedAt.toISOString(),
        about: {
          "@type": "Organization",
          name: providerName,
          url: `${BASE_URL}/status/${alert.source}`,
        },
        isPartOf: {
          "@type": "WebSite",
          name: "DTMonitor",
          url: BASE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "DTMonitor", item: BASE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Provider status",
            item: `${BASE_URL}/status`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: providerName,
            item: `${BASE_URL}/status/${alert.source}`,
          },
          { "@type": "ListItem", position: 4, name: alert.title, item: pageUrl },
        ],
      },
    ],
  };

  const sources: { label: string; url: string; icon: "external" | "users" }[] =
    [];
  if (alert.url) {
    sources.push({ label: hostname(alert.url), url: alert.url, icon: "external" });
  }
  if (provider?.statusUrl && hostname(provider.statusUrl) !== (alert.url ? hostname(alert.url) : "")) {
    sources.push({
      label: hostname(provider.statusUrl),
      url: provider.statusUrl,
      icon: "external",
    });
  }
  if (provider?.downdetectorSlug) {
    sources.push({
      label: "downdetector.com",
      url: `https://downdetector.com/status/${provider.downdetectorSlug}/`,
      icon: "users",
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={`/status/${alert.source}`}
        className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3 w-3" />
        {providerName} service status
      </Link>

      {/* Incident header */}
      <div
        className="glass-card corner-brackets p-5 lg:p-6"
        style={{ borderLeftWidth: 3, borderLeftColor: severityColor?.fg }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity as AlertSeverity} />
          <span
            className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${
              isResolved
                ? "bg-secondary/10 text-secondary"
                : "bg-critical/10 text-critical"
            }`}
          >
            {alert.status}
          </span>
          <span className="rounded-md border border-border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
            {CATEGORY_LABELS[alert.category as AlertCategory] ?? alert.category}
          </span>
          <div className="ml-auto">
            <ShareMenu
              url={pageUrl}
              title={`${providerName}: ${alert.title}`}
              text={`${alert.severity.toUpperCase()} ${alert.status} incident — ${providerName}: ${alert.title}`}
            />
          </div>
        </div>

        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          {alert.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          <Link
            href={`/status/${alert.source}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <ProviderIcon providerKey={alert.source} size={14} />
            {providerName}
          </Link>
          {alert.region && (
            <>
              <span className="text-border">|</span>
              <span>{alert.region}</span>
            </>
          )}
        </div>

        {alert.description && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {alert.description}
          </p>
        )}

        {/* Time facts */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <TimeFact label="Started" value={`${formatDateTime(alert.timestamp)} UTC`} />
          <TimeFact
            label={isResolved ? "Resolved" : "Status"}
            value={
              alert.resolvedAt
                ? `${formatDateTime(alert.resolvedAt)} UTC`
                : "Ongoing"
            }
          />
          <TimeFact
            label={isResolved ? "Duration" : "Elapsed"}
            value={formatDuration(durationMs)}
          />
        </div>

        {/* Verified sources */}
        {sources.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
              Verified sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:border-primary/30 hover:bg-[rgba(242,194,0,0.06)] hover:text-primary"
                >
                  {s.icon === "users" ? (
                    <Users className="h-3 w-3" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Structured metadata */}
      {(Array.isArray(metadata?.updates) ||
        Array.isArray(metadata?.components) ||
        !!metadata?.cvss ||
        metadata?.ransomware === true ||
        typeof metadata?.dueDate === "string") && (
        <div className="glass-card p-5">
          <h2 className="section-label">Incident Detail</h2>
          {Array.isArray(metadata?.components) && (
            <ComponentChips components={metadata.components as string[]} />
          )}
          {!!metadata?.cvss && (
            <CvssBreakdown
              cvss={
                metadata.cvss as React.ComponentProps<
                  typeof CvssBreakdown
                >["cvss"]
              }
            />
          )}
          {metadata?.ransomware === true && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-critical/10 px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-critical">
              <ShieldAlert className="h-3 w-3" />
              Known ransomware campaign
            </span>
          )}
          {typeof metadata?.dueDate === "string" && (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
              Remediation due:{" "}
              <span className="text-text-secondary">
                {String(metadata.dueDate)}
              </span>
            </p>
          )}
          {Array.isArray(metadata?.updates) && (
            <IncidentTimeline
              updates={
                metadata.updates as React.ComponentProps<
                  typeof IncidentTimeline
                >["updates"]
              }
              defaultExpanded
            />
          )}
        </div>
      )}

      {/* Community discussion */}
      <div className="glass-card p-5">
        <h2 className="section-label">Community & Impact</h2>
        <CommunityThreads provider={alert.source} isActive={!isResolved} />
        {!isResolved && hasBlastRadius(alert.source) && (
          <BlastRadiusPanel provider={alert.source} />
        )}
      </div>
    </div>
  );
}

function TimeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-input px-3 py-2">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-text-primary">
        {value}
      </p>
    </div>
  );
}
