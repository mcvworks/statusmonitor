import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS, PROVIDERS } from "@/lib/constants";
import type { AlertCategory } from "@/lib/alert-schema";
import { ProviderIcon } from "@/components/dashboard/ProviderIcon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cloud & SaaS Provider Status Directory",
  description:
    "Live status pages for AWS, Azure, Google Cloud, OpenAI, Cloudflare, GitHub, Slack, and other cloud, SaaS, DevOps, and internet providers.",
  alternates: { canonical: "https://monitor.ducktyped.xyz/status" },
  openGraph: {
    title: "Cloud & SaaS Provider Status Directory | DTMonitor",
    description:
      "Check current status, active outages, and incident history for 26 cloud and SaaS providers.",
    url: "https://monitor.ducktyped.xyz/status",
  },
};

const CATEGORY_ORDER: AlertCategory[] = ["cloud", "devops", "security", "isp"];

export default async function StatusDirectoryPage() {
  const active = await prisma.alert.groupBy({
    by: ["source"],
    where: {
      status: { not: "resolved" },
      signalKind: { in: ["incident", "internet_outage"] },
    },
    _count: true,
  });
  const activeBySource = new Map(active.map((row) => [row.source, row._count]));
  const entries = Object.entries(PROVIDERS);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cloud and SaaS Provider Status Directory",
    url: "https://monitor.ducktyped.xyz/status",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: entries.map(([key, provider], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${provider.name} status`,
        url: `https://monitor.ducktyped.xyz/status/${key}`,
      })),
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="glass-card corner-brackets p-6 lg:p-8">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-primary">
          Provider directory
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary lg:text-3xl">
          Cloud & SaaS Service Status
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Check live status, verified source freshness, active outages, and
          recent incident history for the services your organization depends on.
        </p>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const categoryEntries = entries.filter(([, meta]) => meta.category === category);
        return (
          <section key={category} aria-labelledby={`${category}-providers`}>
            <h2 id={`${category}-providers`} className="section-label mb-3">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryEntries.map(([key, provider]) => {
                const incidentCount = activeBySource.get(key) ?? 0;
                return (
                  <Link
                    key={key}
                    href={`/status/${key}`}
                    className="glass-card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5 hover:border-primary/30"
                  >
                    <ProviderIcon providerKey={key} size={24} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary">
                        {provider.name} status
                      </h3>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                        {incidentCount > 0
                          ? `${incidentCount} active incident${incidentCount === 1 ? "" : "s"}`
                          : provider.category === "security"
                            ? "Security advisory feed"
                            : "No confirmed active incidents"}
                      </p>
                    </div>
                    <span className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
