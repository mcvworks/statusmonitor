import type { Alert } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const SECURITY_KINDS = [
  "exploited-vulnerability",
  "critical-vulnerability",
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
  };
}

export async function getSecurityEvents(limit = 100): Promise<SecurityEventView[]> {
  const alerts = await prisma.alert.findMany({
    where: { category: "security" },
    orderBy: { timestamp: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  return alerts
    .map(toSecurityEvent)
    .sort((a, b) => b.riskScore - a.riskScore || b.alert.timestamp.getTime() - a.alert.timestamp.getTime());
}

