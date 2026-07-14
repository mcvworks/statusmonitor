import type { Alert } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const SECURITY_KINDS = [
  "exploited-vulnerability",
  "critical-vulnerability",
  "security-incident",
  "breach",
  "ransomware",
  "supply-chain",
  "malware-campaign",
] as const;

export type SecurityKind = (typeof SECURITY_KINDS)[number];
export type ExploitationState = "active" | "likely" | "emerging" | "none-known";

export const SECURITY_KIND_LABELS: Record<SecurityKind, string> = {
  "exploited-vulnerability": "Exploited now",
  "critical-vulnerability": "Critical vulnerability",
  "security-incident": "Security incident",
  breach: "Breach",
  ransomware: "Ransomware",
  "supply-chain": "Supply chain",
  "malware-campaign": "Malware campaign",
};

export interface SecurityEventView {
  alert: Alert;
  metadata: Record<string, unknown>;
  kind: SecurityKind;
  exploitationState: ExploitationState;
  riskScore: number;
  action: string | null;
  vendor: string | null;
  product: string | null;
  epssProbability: number | null;
  ransomwareUse: boolean;
  identifiers: string[];
  relatedAlerts: Alert[];
}

export function parseAlertMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "string" ? metadata[key] : null;
}

export function toSecurityEvent(alert: Alert): SecurityEventView {
  const metadata = parseAlertMetadata(alert.metadata);
  const explicitKind = metadataString(metadata, "securityKind");
  const ransomwareUse = metadata.ransomware === true;
  const epss = metadata.epss as { probability?: unknown } | undefined;
  const epssProbability =
    typeof epss?.probability === "number" ? epss.probability : null;
  const identifiers = new Set<string>();
  if (/^(CVE|GHSA)-/i.test(alert.externalId)) identifiers.add(alert.externalId.toUpperCase());
  for (const key of ["cveId", "ghsaId"]) {
    const value = metadataString(metadata, key);
    if (value) identifiers.add(value.toUpperCase());
  }
  if (Array.isArray(metadata.identifiers)) {
    for (const item of metadata.identifiers) {
      if (typeof item === "string") identifiers.add(item.toUpperCase());
      else if (item && typeof item === "object" && typeof (item as { value?: unknown }).value === "string") {
        identifiers.add((item as { value: string }).value.toUpperCase());
      }
    }
  }

  let kind: SecurityKind = "critical-vulnerability";
  if (SECURITY_KINDS.includes(explicitKind as SecurityKind)) {
    kind = explicitKind as SecurityKind;
  } else if (alert.source === "cisa-kev") {
    kind = "exploited-vulnerability";
  }

  let exploitationState: ExploitationState = "none-known";
  if (kind === "exploited-vulnerability" || ransomwareUse) {
    exploitationState = "active";
  } else if (epssProbability !== null && epssProbability >= 0.5) {
    exploitationState = "likely";
  } else if (epssProbability !== null && epssProbability >= 0.1) {
    exploitationState = "emerging";
  }

  const severityPoints = { critical: 45, major: 32, minor: 18, info: 8 }[
    alert.severity
  ] ?? 0;
  const exploitationPoints = {
    active: 40,
    likely: 25,
    emerging: 14,
    "none-known": 0,
  }[exploitationState];
  const ransomwarePoints = ransomwareUse ? 10 : 0;
  const officialPoints = alert.confidence === "official" ? 5 : 0;

  return {
    alert,
    metadata,
    kind,
    exploitationState,
    riskScore: Math.min(
      100,
      severityPoints + exploitationPoints + ransomwarePoints + officialPoints,
    ),
    action: metadataString(metadata, "requiredAction"),
    vendor: metadataString(metadata, "vendor"),
    product: metadataString(metadata, "product"),
    epssProbability,
    ransomwareUse,
    identifiers: [...identifiers],
    relatedAlerts: [],
  };
}

export async function getSecurityEvents(limit = 100): Promise<SecurityEventView[]> {
  const alerts = await prisma.alert.findMany({
    where: { category: "security" },
    orderBy: { timestamp: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  return correlateSecurityEvents(alerts.map(toSecurityEvent));
}

export function correlateSecurityEvents(events: SecurityEventView[]): SecurityEventView[] {
  const grouped = new Map<string, SecurityEventView>();
  for (const event of events) {
    const cve = event.identifiers.find((identifier) => identifier.startsWith("CVE-"));
    const ghsa = event.identifiers.find((identifier) => identifier.startsWith("GHSA-"));
    const key = cve ?? ghsa ?? `${event.alert.source}:${event.alert.externalId}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, event);
      continue;
    }
    if (event.riskScore > existing.riskScore) {
      event.relatedAlerts = [existing.alert, ...existing.relatedAlerts];
      event.identifiers = [...new Set([...event.identifiers, ...existing.identifiers])];
      grouped.set(key, event);
    } else {
      existing.relatedAlerts.push(event.alert, ...event.relatedAlerts);
      existing.identifiers = [...new Set([...existing.identifiers, ...event.identifiers])];
    }
  }

  return [...grouped.values()].sort(
    (a, b) => b.riskScore - a.riskScore || b.alert.timestamp.getTime() - a.alert.timestamp.getTime(),
  );
}
