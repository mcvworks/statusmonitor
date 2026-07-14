import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { PROVIDERS } from "@/lib/constants";

// Rendered per-request: stats/incident lists must be live, not frozen
// into static HTML at build time
export const dynamic = "force-dynamic";

const BASE_URL = "https://monitor.ducktyped.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [latestAlert, providerUpdates, incidents, securityEvents] = await Promise.all([
    prisma.alert.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.alert.groupBy({
      by: ["source"],
      _max: { updatedAt: true },
    }),
    prisma.alert.findMany({
      where: {
        signalKind: { in: ["incident", "internet_outage", "maintenance"] },
      },
      orderBy: { timestamp: "desc" },
      take: 500,
      select: { id: true, updatedAt: true },
    }),
    prisma.alert.findMany({
      where: { category: "security" },
      orderBy: { timestamp: "desc" },
      take: 500,
      select: { id: true, updatedAt: true },
    }),
  ]);

  const latestUpdate = latestAlert?.updatedAt;
  const providerLastModified = new Map(
    providerUpdates.map((row) => [row.source, row._max.updatedAt]),
  );
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: latestUpdate,
    },
    {
      url: `${BASE_URL}/history`,
      lastModified: latestUpdate,
    },
    {
      url: `${BASE_URL}/status`,
      lastModified: latestUpdate,
    },
    {
      url: `${BASE_URL}/security`,
      lastModified: securityEvents[0]?.updatedAt ?? latestUpdate,
    },
    {
      url: `${BASE_URL}/subscribe`,
    },
  ];

  const providerPages: MetadataRoute.Sitemap = Object.keys(PROVIDERS).map(
    (provider) => ({
      url: `${BASE_URL}/status/${provider}`,
      lastModified: providerLastModified.get(provider) ?? undefined,
    }),
  );

  const incidentPages: MetadataRoute.Sitemap = incidents.map((a) => ({
    url: `${BASE_URL}/incident/${a.id}`,
    lastModified: a.updatedAt,
  }));

  const securityPages: MetadataRoute.Sitemap = securityEvents.map((a) => ({
    url: `${BASE_URL}/security/event/${a.id}`,
    lastModified: a.updatedAt,
  }));

  return [...staticPages, ...providerPages, ...incidentPages, ...securityPages];
}
