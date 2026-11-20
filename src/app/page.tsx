import type { Metadata } from "next";
import { getTimedDashboardSummary } from "@/lib/dashboard-summary";
import type { SummarySample } from "@/lib/dashboard-summary-clock";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";

// Rendered per-request: stats/incident lists must be live, not frozen
// into static HTML at build time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Cloud & SaaS Status Monitor — Live Outages | DTMonitor" },
  description:
    "Live status and outage monitoring for AWS, Azure, Google Cloud, OpenAI, Cloudflare, GitHub, Slack, and other cloud and SaaS providers.",
  alternates: { canonical: "https://monitor.ducktyped.xyz" },
};

export default async function Home() {
  // If the snapshot cannot be read the page still renders, and the summary
  // says so. It never falls back to zeros.
  let initialSummary: SummarySample | null = null;
  try {
    initialSummary = await getTimedDashboardSummary();
  } catch (error) {
    console.error("Dashboard summary failed", error);
  }

  return (
    <DashboardClient initialSummary={initialSummary}>
      {/* Passwordless email alert signup */}
      <section
        id="email-alerts"
        aria-labelledby="email-alerts-heading"
        className="glass-card scroll-mt-28 p-4"
      >
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-secondary-ink">
          Automated alerts
        </p>
        <h2
          id="email-alerts-heading"
          className="mt-2 text-lg font-semibold text-text-primary"
        >
          Follow outages and security advisories
        </h2>
        <p className="mb-4 mt-2 text-[13px] leading-6 text-text-secondary">
          Choose providers and severity, confirm your email, and receive
          matching alerts as source updates are collected. No account required.
        </p>
        <SubscriptionForm compact />
      </section>
    </DashboardClient>
  );
}
