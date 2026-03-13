import { Activity, AlertTriangle, Clock, Shield } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusOverview } from "@/components/dashboard/StatusOverview";
import { AlertList } from "@/components/dashboard/AlertList";

async function getStats() {
  const [activeCount, securityCount, lastPoll] = await Promise.all([
    prisma.alert.count({
      where: { status: { not: "resolved" } },
    }),
    prisma.alert.count({
      where: { category: "security", status: { not: "resolved" } },
    }),
    prisma.pollLog.findFirst({
      orderBy: { completedAt: "desc" },
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  return { activeCount, securityCount, lastPoll: lastPoll?.completedAt };
}

function formatPollTime(date: Date | null | undefined): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export default async function Home() {
  const { activeCount, securityCount, lastPoll } = await getStats();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="glass-card corner-brackets relative overflow-hidden rounded-2xl p-6 lg:p-8">
        <div className="relative z-10">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-primary lg:text-3xl">
            Service Status Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Real-time monitoring of cloud platforms, DevOps tools, security
            advisories, and ISP connectivity.
          </p>
        </div>
        {/* Radial glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(242,194,0,0.06),transparent_70%)]" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Activity className="h-5 w-5 text-secondary" />}
          label="Services Monitored"
          value="22"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-critical" />}
          label="Active Incidents"
          value={String(activeCount)}
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-minor" />}
          label="Last Poll"
          value={formatPollTime(lastPoll)}
        />
        <SummaryCard
          icon={<Shield className="h-5 w-5 text-info" />}
          label="Security Advisories"
          value={String(securityCount)}
        />
      </div>

      {/* Provider status grid */}
      <StatusOverview />

      {/* Alert feed */}
      <AlertList />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-input">
        {icon}
      </div>
      <div>
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
