import { z } from "zod";

// ─── Enums ─────────────────────────────────────────────────

export const AlertSeverity = z.enum(["critical", "major", "minor", "info"]);
export type AlertSeverity = z.infer<typeof AlertSeverity>;

export const AlertCategory = z.enum(["cloud", "devops", "security", "isp"]);
export type AlertCategory = z.infer<typeof AlertCategory>;

export const AlertStatus = z.enum([
  "active",
  "resolved",
  "investigating",
  "monitoring",
]);
export type AlertStatus = z.infer<typeof AlertStatus>;

export const SignalKind = z.enum([
  "incident",
  "advisory",
  "internet_outage",
  "community_signal",
  "maintenance",
]);
export type SignalKind = z.infer<typeof SignalKind>;

export const SignalConfidence = z.enum([
  "official",
  "corroborated",
  "observed",
  "crowdsourced",
]);
export type SignalConfidence = z.infer<typeof SignalConfidence>;

// ─── Provider Input ────────────────────────────────────────

export const AlertInputSchema = z.object({
  externalId: z.string().min(1),
  source: z.string().min(1),
  category: AlertCategory,
  severity: AlertSeverity,
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  region: z.string().optional(),
  timestamp: z.date(),
  status: AlertStatus,
  resolvedAt: z.date().optional(),
  metadata: z.any().optional(),
  signalKind: SignalKind.optional(),
  confidence: SignalConfidence.optional(),
  expiresAt: z.date().optional(),
});

export type AlertInput = z.infer<typeof AlertInputSchema>;

// ─── API Response ──────────────────────────────────────────

export const SerializedAlertSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  source: z.string(),
  category: AlertCategory,
  severity: AlertSeverity,
  previousSeverity: AlertSeverity.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  region: z.string().nullable(),
  timestamp: z.string(),
  status: AlertStatus,
  signalKind: SignalKind,
  confidence: SignalConfidence,
  metadata: z.any().nullable(),
  resolvedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  lastObservedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SerializedAlert = z.infer<typeof SerializedAlertSchema>;

// ─── User Alert State ──────────────────────────────────────

export const UserAlertStateValue = z.enum(["acknowledged", "snoozed", "dismissed"]);
export type UserAlertStateValue = z.infer<typeof UserAlertStateValue>;

export interface AlertUserState {
  state: UserAlertStateValue;
  snoozedUntil: string | null;
}

export type SerializedAlertWithState = SerializedAlert & {
  userState: AlertUserState | null;
};
