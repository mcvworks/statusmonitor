import { z } from "zod";

const envSchema = z.object({
  // ─── Required ──────────────────────────────────────────────
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url(),

  // ─── OAuth (optional — enable per provider) ────────────────
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_MICROSOFT_ID: z.string().optional(),
  AUTH_MICROSOFT_SECRET: z.string().optional(),
  AUTH_APPLE_ID: z.string().optional(),
  AUTH_APPLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // ─── Notifications (optional) ──────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // ─── Push Notifications (optional) ─────────────────────────
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // ─── Provider API Keys (optional) ──────────────────────────
  CLOUDFLARE_RADAR_API_KEY: z.string().optional(),
  NVD_API_KEY: z.string().optional(),

  // ─── Runtime ───────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  return result.data;
}

export const env = validateEnv();
