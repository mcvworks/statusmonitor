import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = "https://monitor.ducktyped.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/history`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  // Recent incidents — each detail page is indexable
  const incidents = await prisma.alert.findMany({
    orderBy: { timestamp: "desc" },
    take: 500,
    select: { id: true, updatedAt: true, status: true },
  });

  const incidentPages: MetadataRoute.Sitemap = incidents.map((a) => ({
    url: `${BASE_URL}/incident/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: a.status === "resolved" ? "monthly" : "hourly",
    priority: a.status === "resolved" ? 0.4 : 0.7,
  }));

  return [...staticPages, ...incidentPages];
}
