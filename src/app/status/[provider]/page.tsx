import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, History, Radio } from "lucide-react";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS, PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";
import { getProvider } from "@/lib/providers/registry";
import type { AlertSeverity } from "@/lib/alert-schema";
import { ProviderIcon } from "@/components/dashboard/ProviderIcon";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";

const BASE_URL = "https://monitor.ducktyped.xyz";
const DAY_MS = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return Object.keys(PROVIDERS).map((provider) => ({ provider }));
}

function seoCopy(key: string) {
  const provider = PROVIDERS[key];
  if (provider.category === "security") {
    return {
      title: `${provider.name} Security Advisories & Vulnerability Feed`,
      description: `Track recent ${provider.name} security advisories, severity, exploit risk, affected products, and remediation information.`,
    };
  }
  return {
    title: `${provider.name} Status — Live Outages & Incident History`,
    description: `Check the current ${provider.name} status, active outages, affected regions and components, source freshness, and recent incident history.`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider: key } = await params;
  if (!PROVIDERS[key]) return { title: "Provider not found" };
  const copy = seoCopy(key);
  const url = `${BASE_URL}/status/${key}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${copy.title} | DTMonitor`,
      description: copy.description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | DTMonitor`,
      description: copy.description,
    },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function dataState(
  key: string,
  state: {
    lastSuccessAt: Date | null;
    lastError: string | null;
    consecutiveFailures: number;
  } | null,
) {
  if (!state) return "pending" as const;
  if (state.lastError?.toLowerCase().includes("not configured")) {
    return "not configured" as const;
  }
  const adapter = getProvider(key);
  const freshnessWindow = Math.max(
    adapter?.pollInterval === "fast" ? 6 * 60_000 : 15 * 60_000,
    (adapter?.minimumIntervalMs ?? 0) * 1.5,
  );
  if (!state.lastSuccessAt || Date.now() - state.lastSuccessAt.getTime() > freshnessWindow) {
    return "stale" as const;
  }
  if (state.consecutiveFailures > 0) return "error" as const;
  return "healthy" as const;
}

export default async function ProviderStatusPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider: key } = await params;
  const provider = PROVIDERS[key];
  if (!provider) notFound();

  // Server component is rendered per-request; the rolling window is intentionally based on request time.
  // eslint-disable-next-line react-hooks/purity
  const windowStart = new Date(Date.now() - 30 * DAY_MS);
  const [activeIncidents, recentAlerts, incidentCount, providerState] =
    await Promise.all([
      prisma.alert.findMany({
        where: {
          source: key,
          status: { not: "resolved" },
          signalKind: { in: ["incident", "internet_outage"] },
        },
        orderBy: [{ severity: "asc" }, { timestamp: "desc" }],
      }),
      prisma.alert.findMany({
        where: { source: key },
        orderBy: { timestamp: "desc" },
        take: 20,
      }),
      prisma.alert.count({
        where: {
          source: key,
          timestamp: { gte: windowStart },
          signalKind: { in: ["incident", "internet_outage"] },
        },
      }),
      prisma.providerState.findUnique({ where: { provider: key } }),
    ]);

  const sourceState = dataState(key, providerState);
  const worst = activeIncidents.reduce<AlertSeverity | null>((current, alert) => {
    const severity = alert.severity as AlertSeverity;
    if (!current || SEVERITY_ORDER[severity] < SEVERITY_ORDER[current]) return severity;
    return current;
  }, null);
  const currentStatus =
    sourceState !== "healthy"
      ? "Unknown"
      : provider.category === "security"
        ? "Advisory feed healthy"
        : worst === "critical" || worst === "major"
          ? "Service outage"
          : worst
            ? "Degraded performance"
            : "Operational";
  const statusColor =
    currentStatus === "Operational" || currentStatus === "Advisory feed healthy"
      ? "text-secondary"
      : currentStatus === "Unknown"
        ? "text-text-muted"
        : currentStatus === "Service outage"
          ? "text-critical"
          : "text-minor";
  const copy = seoCopy(key);
  const pageUrl = `${BASE_URL}/status/${key}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: copy.title,
        description: copy.description,
        url: pageUrl,
        dateModified:
          recentAlerts[0]?.updatedAt.toISOString() ?? providerState?.updatedAt.toISOString(),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "DTMonitor", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Provider Status", item: `${BASE_URL}/status` },
          { "@type": "ListItem", position: 3, name: provider.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
        <Link href="/" className="hover:text-primary">DTMonitor</Link>
        <span className="mx-2">/</span>
        <Link href="/status" className="hover:text-primary">Provider status</Link>
        <span className="mx-2">/</span>
        <span>{provider.name}</span>
      </nav>

      <header className="glass-card corner-brackets p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProviderIcon providerKey={key} size={38} />
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-text-muted">
                {CATEGORY_LABELS[provider.category]}
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-text-primary lg:text-2xl">
                {provider.name} {provider.category === "security" ? "Security Advisories" : "Service Status"}
              </h1>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${statusColor}`}>{currentStatus}</p>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
              Source: {sourceState}
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">
          {copy.description} DTMonitor checks the official source and clearly marks stale or unavailable data instead of assuming the service is healthy.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Provider status facts">
        <Fact label="Active incidents" value={String(activeIncidents.length)} />
        <Fact label="Incidents in 30 days" value={String(incidentCount)} />
        <Fact
          label="Last verified"
          value={providerState?.lastSuccessAt ? formatDate(providerState.lastSuccessAt) : "Awaiting first poll"}
        />
      </section>

      {activeIncidents.length > 0 && (
        <section className="glass-card p-5" aria-labelledby="active-incidents">
          <h2 id="active-incidents" className="section-label mb-4">Active {provider.name} incidents</h2>
          <div className="space-y-3">
            {activeIncidents.map((alert) => (
              <IncidentRow key={alert.id} alert={alert} providerName={provider.name} />
            ))}
          </div>
        </section>
      )}

      <section className="glass-card p-5" aria-labelledby="recent-history">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-history" className="section-label">Recent {provider.name} incident history</h2>
          <Link href="/history" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <History className="h-3 w-3" /> Full history
          </Link>
        </div>
        {recentAlerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">No recent records from this source.</p>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <IncidentRow key={alert.id} alert={alert} providerName={provider.name} />
            ))}
          </div>
        )}
      </section>

      <section className="glass-card p-5" aria-labelledby="source-information">
        <h2 id="source-information" className="section-label mb-3">Source information</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Status information is attributed to the provider&apos;s official status page or feed. Source freshness is shown separately because an unreachable feed is not evidence that a service is operational.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={provider.statusUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-primary/30 hover:text-primary">
            <Radio className="h-3 w-3" /> Official {provider.name} status <ExternalLink className="h-3 w-3" />
          </a>
          {provider.historyUrl && (
            <a href={provider.historyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-primary/30 hover:text-primary">
              Official incident history <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function IncidentRow({
  alert,
  providerName,
}: {
  alert: {
    id: string;
    title: string;
    severity: string;
    status: string;
    timestamp: Date;
    region: string | null;
    signalKind: string;
  };
  providerName: string;
}) {
  return (
    <Link href={`/incident/${alert.id}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:border-primary/30 hover:bg-surface-hover">
      <SeverityBadge severity={alert.severity as AlertSeverity} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-text-primary">{alert.title}</h3>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          {providerName} · {formatDate(alert.timestamp)}
          {alert.region ? ` · ${alert.region}` : ""} · {alert.status}
        </p>
      </div>
      <span className="text-text-muted">→</span>
    </Link>
  );
}
