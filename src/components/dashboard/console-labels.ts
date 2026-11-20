import type { AlertSeverity } from "@/lib/alert-schema";
import type { DashboardSummary } from "@/lib/dashboard-snapshot";
import { PROVIDERS, SEVERITY_ORDER } from "@/lib/constants";

/** Shared wording and colors for the homepage Console pieces. */

export const MONO = "font-[family-name:var(--font-mono)]";

export const SEVERITIES = (Object.keys(SEVERITY_ORDER) as AlertSeverity[]).sort(
  (a, b) => SEVERITY_ORDER[a] - SEVERITY_ORDER[b],
);

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Info",
};

/**
 * Text-safe severity colors. The .console scope in globals.css swaps these
 * for darker inks in the light theme, where the brand colors are too pale
 * to read as text.
 */
export const SEVERITY_INK: Record<AlertSeverity, string> = {
  critical: "var(--ink-critical)",
  major: "var(--ink-major)",
  minor: "var(--ink-minor)",
  info: "var(--ink-info)",
};

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

export function providerName(key: string): string {
  return PROVIDERS[key]?.name ?? key;
}


/** Only complete service coverage supports a current zero across the Console. */
export function hasCompleteServiceCoverage(summary: DashboardSummary): boolean {
  const services = summary.providers.filter((provider) => provider.role === "service");
  return services.length > 0 && services.every((provider) => provider.coverage === "fresh");
}
