import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck, Siren } from "lucide-react";
import type { SecurityEventView } from "@/lib/security";
import { SECURITY_KIND_LABELS } from "@/lib/security";
import { PROVIDERS, SEVERITY_COLORS } from "@/lib/constants";
import type { AlertSeverity } from "@/lib/alert-schema";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";

export function SecurityEventCard({ event }: { event: SecurityEventView }) {
  const { alert } = event;
  const sourceName = PROVIDERS[alert.source]?.name ?? alert.source;
  const color = SEVERITY_COLORS[alert.severity as AlertSeverity]?.fg;

  return (
    <article
      className="glass-card p-5"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={alert.severity as AlertSeverity} />
        <span className="rounded-full border border-border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
          {SECURITY_KIND_LABELS[event.kind]}
        </span>
        {event.exploitationState === "active" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-critical/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-critical">
            <Siren className="h-3 w-3" /> Active exploitation
          </span>
        )}
        <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          Risk {event.riskScore}/100
        </span>
      </div>

      <h2 className="mt-3 text-base font-semibold leading-snug text-text-primary">
        <Link href={`/security/event/${alert.id}`} className="hover:text-primary">
          {alert.title}
        </Link>
      </h2>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1 text-secondary">
          <ShieldCheck className="h-3 w-3" /> {sourceName} · {alert.confidence}
        </span>
        <span>{formatRelativeTime(alert.timestamp)}</span>
        {event.vendor && <span>{event.vendor}{event.product ? ` · ${event.product}` : ""}</span>}
        {event.epssProbability !== null && (
          <span>EPSS {(event.epssProbability * 100).toFixed(1)}%</span>
        )}
        {event.relatedAlerts.length > 0 && (
          <span>{event.relatedAlerts.length + 1} correlated sources</span>
        )}
      </div>

      {alert.description && (
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {truncate(alert.description, 320)}
        </p>
      )}

      {event.action && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-primary">
            Recommended action
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">{event.action}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href={`/security/event/${alert.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Evidence and remediation <ArrowRight className="h-3 w-3" />
        </Link>
        {alert.url && (
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
          >
            Primary source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
