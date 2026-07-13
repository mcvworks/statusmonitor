import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PROVIDERS } from "@/lib/constants";

export const ALERT_SEVERITIES = ["critical", "major", "minor", "info"] as const;
export const DEFAULT_ALERT_SEVERITIES = ["critical", "major"];
export const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateFilters(severities: unknown, sources: unknown) {
  if (!Array.isArray(severities) || severities.length === 0) {
    throw new Error("Select at least one severity");
  }
  if (!Array.isArray(sources)) {
    throw new Error("Invalid provider selection");
  }

  const cleanSeverities = [...new Set(severities.filter((item): item is string =>
    typeof item === "string" && (ALERT_SEVERITIES as readonly string[]).includes(item),
  ))];
  const cleanSources = [...new Set(sources.filter((item): item is string =>
    typeof item === "string" && Object.hasOwn(PROVIDERS, item),
  ))];

  if (cleanSeverities.length !== severities.length) throw new Error("Invalid severity selection");
  if (cleanSources.length !== sources.length) throw new Error("Invalid provider selection");

  return { severities: cleanSeverities, sources: cleanSources };
}

export function createConfirmationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createManageToken(subscriptionId: string): string {
  return createHmac("sha256", signingSecret())
    .update(`email-subscription:${subscriptionId}`)
    .digest("base64url");
}

export function verifyManageToken(subscriptionId: string, token: string): boolean {
  if (!subscriptionId || !token) return false;
  const expected = Buffer.from(createManageToken(subscriptionId));
  const supplied = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function appUrl(path = ""): string {
  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://monitor.ducktyped.xyz";
  return `${base.replace(/\/$/, "")}${path}`;
}

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for subscription links");
  return secret;
}
