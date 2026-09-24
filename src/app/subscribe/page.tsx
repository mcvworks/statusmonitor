import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CheckCircle2, LockKeyhole } from "lucide-react";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";

export const metadata: Metadata = {
  title: "Email Outage and Security Alerts",
  description: "Choose providers and severity for outage and security advisory emails. No account required. Manage preferences or unsubscribe through a private email link.",
  alternates: { canonical: "https://monitor.ducktyped.xyz/subscribe" },
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <BellRing className="mx-auto h-9 w-9 text-primary-ink" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-text-primary">Service and security alerts without an account</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">Choose your providers and severity to receive matching outage reports and security advisories by email.</p>
      </div>
      <div className="glass-card rounded-2xl p-5 sm:p-7"><SubscriptionForm /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [CheckCircle2, "Choose providers", "Follow every service or only your stack."],
          [BellRing, "Automatic delivery", "New matching alerts are emailed after source updates are collected."],
          [LockKeyhole, "No password", "Confirm, manage, or unsubscribe from your email."],
        ].map(([Icon, title, text]) => {
          const ItemIcon = Icon as typeof BellRing;
          return <div key={title as string} className="rounded-xl border border-border bg-surface p-4"><ItemIcon className="h-5 w-5 text-secondary-ink" /><h2 className="mt-2 text-sm font-semibold text-text-primary">{title as string}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{text as string}</p></div>;
        })}
      </div>
      <section className="glass-card space-y-4 rounded-2xl p-5 sm:p-7" aria-labelledby="email-help-heading">
        <h2 id="email-help-heading" className="text-lg font-semibold text-text-primary">Before you subscribe</h2>
        <details className="text-sm"><summary className="cursor-pointer font-medium text-text-primary">What emails will I receive?</summary><p className="mt-2 leading-6 text-text-secondary">The starting selection includes critical and major alerts from all monitored providers. Choose specific providers to narrow it down. Security sources can send vulnerability advisories; an advisory does not mean a service is down or that your systems are affected.</p></details>
        <details className="text-sm"><summary className="cursor-pointer font-medium text-text-primary">How quickly do alerts arrive?</summary><p className="mt-2 leading-6 text-text-secondary">DTMonitor checks sources periodically, then sends matching new alerts. Timing depends on when a provider publishes an update and when it is collected. Check the linked official source for the latest details.</p></details>
        <details className="text-sm"><summary className="cursor-pointer font-medium text-text-primary">How do I stop receiving alerts?</summary><p className="mt-2 leading-6 text-text-secondary">Use Unsubscribe in an alert email, or <Link href="/subscribe/manage" className="text-primary-ink underline">request a management link</Link>, then select Unsubscribe from email alerts. Stop browser notifications or disconnect Slack and Teams separately in <Link href="/dashboard/settings" className="text-primary-ink underline">alert settings</Link>.</p></details>
      </section>
    </div>
  );
}
