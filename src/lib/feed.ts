import { prisma } from "./db";
import { PROVIDERS, CATEGORY_LABELS } from "./constants";
import {
  AlertCategory,
  AlertSeverity,
  type AlertCategory as AlertCategoryType,
} from "./alert-schema";

export const FEED_BASE_URL = "https://monitor.ducktyped.xyz";
const FEED_LIMIT = 50;

export interface FeedFilters {
  source?: string;
  category?: string;
  severity?: string;
}

/** Validate feed query params — unknown values are ignored, not errors */
export function parseFeedFilters(params: URLSearchParams): FeedFilters {
  const filters: FeedFilters = {};
  const source = params.get("source");
  if (source && PROVIDERS[source]) filters.source = source;
  const category = params.get("category");
  if (category && AlertCategory.safeParse(category).success) {
    filters.category = category;
  }
  const severity = params.get("severity");
  if (severity && AlertSeverity.safeParse(severity).success) {
    filters.severity = severity;
  }
  return filters;
}

export async function getFeedAlerts(filters: FeedFilters) {
  return prisma.alert.findMany({
    where: {
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.category
        ? { category: filters.category }
        : { category: { not: "security" } }),
      ...(filters.severity ? { severity: filters.severity } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: FEED_LIMIT,
  });
}

export function feedTitle(filters: FeedFilters): string {
  const parts = ["DTMonitor Alerts"];
  if (filters.source) parts.push(PROVIDERS[filters.source]?.name ?? filters.source);
  if (filters.category) {
    parts.push(CATEGORY_LABELS[filters.category as AlertCategoryType]);
  }
  if (filters.severity) parts.push(filters.severity);
  return parts.join(" — ");
}

export function feedQueryString(filters: FeedFilters): string {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  if (filters.severity) params.set("severity", filters.severity);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function providerName(source: string): string {
  return PROVIDERS[source]?.name ?? source;
}
