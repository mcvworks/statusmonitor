import { prisma } from "@/lib/db";
import { DEPENDENCY_MAP, type DependentService, type ConfidenceLevel } from "./static-map";

export interface AffectedService extends DependentService {
  provider: string;
  hasActiveAlert: boolean;
}

/**
 * Get all services that depend on a given provider.
 * Optionally filter by region.
 */
export function getAffectedServices(
  provider: string,
  region?: string
): DependentService[] {
  const normalized = provider.toLowerCase();
  const map = DEPENDENCY_MAP.find((m) => m.provider === normalized);
  if (!map) return [];

  if (!region) return map.services;

  return map.services.filter(
    (s) => !s.regions || s.regions.length === 0 || s.regions.includes(region)
  );
}

/**
 * Get all providers that a given service depends on.
 */
export function getProvidersForService(
  service: string
): Array<{ provider: string; confidence: ConfidenceLevel }> {
  const normalized = service.toLowerCase();
  const results: Array<{ provider: string; confidence: ConfidenceLevel }> = [];

  for (const map of DEPENDENCY_MAP) {
    for (const dep of map.services) {
      if (dep.service.toLowerCase() === normalized) {
        results.push({ provider: map.provider, confidence: dep.confidence });
      }
    }
  }

  return results;
}

/**
 * Get affected services for a provider, enriched with active alert status.
 * If a dependent service also has an active alert, it's marked as "confirmed affected".
 */
export async function getAffectedServicesWithAlertStatus(
  provider: string,
  region?: string
): Promise<AffectedService[]> {
  const services = getAffectedServices(provider, region);
  if (services.length === 0) return [];

  // Get all active alerts to check if dependent services also have incidents
  const activeAlerts = await prisma.alert.findMany({
    where: { status: { in: ["active", "investigating", "monitoring"] } },
    select: { source: true, title: true },
  });

  const activeSourcesAndTitles = new Set(
    activeAlerts.flatMap((a) => [
      a.source.toLowerCase(),
      a.title.toLowerCase(),
    ])
  );

  return services.map((svc) => {
    const svcLower = svc.service.toLowerCase();
    const hasActiveAlert = activeSourcesAndTitles.has(svcLower) ||
      [...activeSourcesAndTitles].some((s) => s.includes(svcLower));

    return {
      ...svc,
      provider,
      hasActiveAlert,
    };
  });
}
