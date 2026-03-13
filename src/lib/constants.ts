import type { AlertCategory, AlertSeverity } from "./alert-schema";

// ─── Polling Intervals ─────────────────────────────────────

export const FAST_POLL_MS = 2 * 60 * 1000; // 2 minutes
export const SLOW_POLL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Alert Cleanup ─────────────────────────────────────────

export const MAX_ALERT_AGE_DAYS = 90;

// ─── Severity Levels ───────────────────────────────────────

export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3,
};

export const SEVERITY_COLORS: Record<
  AlertSeverity,
  { fg: string; bg: string }
> = {
  critical: { fg: "#ff6b6b", bg: "rgba(255, 107, 107, 0.06)" },
  major: { fg: "#FA6216", bg: "rgba(250, 98, 22, 0.06)" },
  minor: { fg: "#F2C200", bg: "rgba(242, 194, 0, 0.08)" },
  info: { fg: "#48E0C7", bg: "rgba(72, 224, 199, 0.06)" },
};

// ─── Categories ────────────────────────────────────────────

export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  cloud: "Cloud",
  devops: "DevOps",
  security: "Security",
  isp: "ISP",
};

// ─── Providers ─────────────────────────────────────────────

export type ProviderTier = "fast" | "slow";

export interface ProviderMeta {
  name: string;
  category: AlertCategory;
  tier: ProviderTier;
}

export const PROVIDERS: Record<string, ProviderMeta> = {
  // Cloud (fast tier)
  aws: { name: "AWS", category: "cloud", tier: "fast" },
  azure: { name: "Azure", category: "cloud", tier: "fast" },
  gcp: { name: "Google Cloud", category: "cloud", tier: "fast" },
  cloudflare: { name: "Cloudflare", category: "cloud", tier: "fast" },
  github: { name: "GitHub", category: "cloud", tier: "fast" },
  microsoft365: { name: "Microsoft 365", category: "cloud", tier: "fast" },
  slack: { name: "Slack", category: "cloud", tier: "fast" },
  atlassian: { name: "Atlassian", category: "cloud", tier: "fast" },
  okta: { name: "Okta", category: "cloud", tier: "fast" },
  stripe: { name: "Stripe", category: "cloud", tier: "fast" },
  googleWorkspace: {
    name: "Google Workspace",
    category: "cloud",
    tier: "fast",
  },
  digitalocean: { name: "DigitalOcean", category: "cloud", tier: "fast" },
  fastly: { name: "Fastly", category: "cloud", tier: "fast" },
  vercelNetlify: {
    name: "Vercel / Netlify",
    category: "cloud",
    tier: "fast",
  },

  // DevOps (slow tier)
  datadog: { name: "Datadog", category: "devops", tier: "slow" },
  pagerduty: { name: "PagerDuty", category: "devops", tier: "slow" },
  dockerHub: { name: "Docker Hub", category: "devops", tier: "slow" },
  npmRegistry: { name: "npm Registry", category: "devops", tier: "slow" },

  // Security (slow tier)
  cisaKev: { name: "CISA KEV", category: "security", tier: "slow" },
  nvd: { name: "NVD", category: "security", tier: "slow" },

  // ISP (slow tier)
  cloudflareRadar: {
    name: "Cloudflare Radar",
    category: "isp",
    tier: "slow",
  },

  // Meta (slow tier)
  downdetector: { name: "Downdetector", category: "cloud", tier: "slow" },
};
