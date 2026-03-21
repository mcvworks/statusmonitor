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
  color: string;
  /** simple-icons slug (null = use monogram fallback) */
  iconSlug: string | null;
  statusUrl: string;
  historyUrl: string | null;
}

export const PROVIDERS: Record<string, ProviderMeta> = {
  // Cloud (fast tier)
  aws: {
    name: "AWS",
    category: "cloud",
    tier: "fast",
    color: "#FF9900",
    iconSlug: null,
    statusUrl: "https://health.aws.amazon.com/health/status",
    historyUrl: "https://health.aws.amazon.com/health/status",
  },
  azure: {
    name: "Azure",
    category: "cloud",
    tier: "fast",
    color: "#0078D4",
    iconSlug: null,
    statusUrl: "https://status.azure.com/en-us/status",
    historyUrl: "https://status.azure.com/en-us/status/history/",
  },
  gcp: {
    name: "Google Cloud",
    category: "cloud",
    tier: "fast",
    color: "#4285F4",
    iconSlug: "googlecloud",
    statusUrl: "https://status.cloud.google.com/",
    historyUrl: "https://status.cloud.google.com/summary",
  },
  cloudflare: {
    name: "Cloudflare",
    category: "cloud",
    tier: "fast",
    color: "#F38020",
    iconSlug: "cloudflare",
    statusUrl: "https://www.cloudflarestatus.com/",
    historyUrl: "https://www.cloudflarestatus.com/history",
  },
  github: {
    name: "GitHub",
    category: "cloud",
    tier: "fast",
    color: "#8B5CF6",
    iconSlug: "github",
    statusUrl: "https://www.githubstatus.com/",
    historyUrl: "https://www.githubstatus.com/history",
  },
  microsoft365: {
    name: "Microsoft 365",
    category: "cloud",
    tier: "fast",
    color: "#D83B01",
    iconSlug: null,
    statusUrl: "https://status.office.com/",
    historyUrl: null,
  },
  slack: {
    name: "Slack",
    category: "cloud",
    tier: "fast",
    color: "#4A154B",
    iconSlug: null,
    statusUrl: "https://status.slack.com/",
    historyUrl: "https://status.slack.com/calendar",
  },
  atlassian: {
    name: "Atlassian",
    category: "cloud",
    tier: "fast",
    color: "#0052CC",
    iconSlug: "atlassian",
    statusUrl: "https://status.atlassian.com/",
    historyUrl: "https://status.atlassian.com/history",
  },
  okta: {
    name: "Okta",
    category: "cloud",
    tier: "fast",
    color: "#007DC1",
    iconSlug: "okta",
    statusUrl: "https://status.okta.com/",
    historyUrl: "https://status.okta.com/history",
  },
  stripe: {
    name: "Stripe",
    category: "cloud",
    tier: "fast",
    color: "#635BFF",
    iconSlug: "stripe",
    statusUrl: "https://status.stripe.com/",
    historyUrl: "https://status.stripe.com/history",
  },
  googleWorkspace: {
    name: "Google Workspace",
    category: "cloud",
    tier: "fast",
    color: "#4285F4",
    iconSlug: "google",
    statusUrl: "https://www.google.com/appsstatus/dashboard/",
    historyUrl: "https://www.google.com/appsstatus/dashboard/summary",
  },
  digitalocean: {
    name: "DigitalOcean",
    category: "cloud",
    tier: "fast",
    color: "#0080FF",
    iconSlug: "digitalocean",
    statusUrl: "https://status.digitalocean.com/",
    historyUrl: "https://status.digitalocean.com/history",
  },
  fastly: {
    name: "Fastly",
    category: "cloud",
    tier: "fast",
    color: "#FF282D",
    iconSlug: "fastly",
    statusUrl: "https://status.fastly.com/",
    historyUrl: "https://status.fastly.com/history",
  },
  vercelNetlify: {
    name: "Vercel / Netlify",
    category: "cloud",
    tier: "fast",
    color: "#00C7B7",
    iconSlug: "vercel",
    statusUrl: "https://www.vercel-status.com/",
    historyUrl: "https://www.vercel-status.com/history",
  },

  // DevOps (slow tier)
  datadog: {
    name: "Datadog",
    category: "devops",
    tier: "slow",
    color: "#632CA6",
    iconSlug: "datadog",
    statusUrl: "https://status.datadoghq.com/",
    historyUrl: "https://status.datadoghq.com/history",
  },
  pagerduty: {
    name: "PagerDuty",
    category: "devops",
    tier: "slow",
    color: "#06AC38",
    iconSlug: "pagerduty",
    statusUrl: "https://status.pagerduty.com/",
    historyUrl: "https://status.pagerduty.com/history",
  },
  dockerHub: {
    name: "Docker Hub",
    category: "devops",
    tier: "slow",
    color: "#2496ED",
    iconSlug: "docker",
    statusUrl: "https://www.dockerstatus.com/",
    historyUrl: "https://www.dockerstatus.com/history",
  },
  npmRegistry: {
    name: "npm Registry",
    category: "devops",
    tier: "slow",
    color: "#CB3837",
    iconSlug: "npm",
    statusUrl: "https://status.npmjs.org/",
    historyUrl: "https://status.npmjs.org/history",
  },

  // Security (slow tier)
  cisaKev: {
    name: "CISA KEV",
    category: "security",
    tier: "slow",
    color: "#005288",
    iconSlug: null,
    statusUrl: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    historyUrl: null,
  },
  nvd: {
    name: "NVD",
    category: "security",
    tier: "slow",
    color: "#003366",
    iconSlug: null,
    statusUrl: "https://nvd.nist.gov/",
    historyUrl: null,
  },

  // ISP (slow tier)
  cloudflareRadar: {
    name: "Cloudflare Radar",
    category: "isp",
    tier: "slow",
    color: "#F38020",
    iconSlug: "cloudflare",
    statusUrl: "https://radar.cloudflare.com/",
    historyUrl: null,
  },

  // Meta (slow tier)
  downdetector: {
    name: "Downdetector",
    category: "cloud",
    tier: "slow",
    color: "#FF160A",
    iconSlug: "downdetector",
    statusUrl: "https://downdetector.com/",
    historyUrl: null,
  },
};
