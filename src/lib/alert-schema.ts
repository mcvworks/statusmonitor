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
});

export type AlertInput = z.infer<typeof AlertInputSchema>;

// ─── API Response ──────────────────────────────────────────

export const SerializedAlertSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  source: z.string(),
  category: AlertCategory,
  severity: AlertSeverity,
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  region: z.string().nullable(),
  timestamp: z.string(),
  status: AlertStatus,
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SerializedAlert = z.infer<typeof SerializedAlertSchema>;
