import type { Metadata } from "next";
import { BellRing, CheckCircle2, LockKeyhole } from "lucide-react";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";

export const metadata: Metadata = {
  title: "Email Outage Alerts | DTMonitor",
  description: "Get automated email alerts for outages and incidents from the cloud and SaaS providers you use. No account or password required.",
  alternates: { canonical: "https://monitor.ducktyped.xyz/subscribe" },
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <BellRing className="mx-auto h-9 w-9 text-primary" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-text-primary">Outage alerts without an account</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">Enter your email, choose what matters, and DTMonitor will automatically notify you when matching incidents are detected.</p>
      </div>
      <div className="glass-card rounded-2xl p-5 sm:p-7"><SubscriptionForm /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [CheckCircle2, "Choose providers", "Follow every service or only your stack."],
          [BellRing, "Automatic delivery", "New matching incidents trigger email alerts."],
          [LockKeyhole, "No password", "Confirm, manage, or unsubscribe from your email."],
        ].map(([Icon, title, text]) => {
          const ItemIcon = Icon as typeof BellRing;
          return <div key={title as string} className="rounded-xl border border-border bg-surface p-4"><ItemIcon className="h-5 w-5 text-secondary" /><h2 className="mt-2 text-sm font-semibold text-text-primary">{title as string}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{text as string}</p></div>;
        })}
      </div>
    </div>
  );
}
