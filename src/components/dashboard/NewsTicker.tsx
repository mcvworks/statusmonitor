"use client";

import Link from "next/link";
import { ExternalLink, Radio, Rss } from "lucide-react";
import type { SerializedAlert, AlertSeverity } from "@/lib/alert-schema";
import { PROVIDERS, SEVERITY_COLORS } from "@/lib/constants";
import { formatRelativeTime, ensureReadable, truncate } from "@/lib/utils";
import { useAlerts } from "@/hooks/useAlerts";
import { ProviderIcon } from "./ProviderIcon";

const MAX_ITEMS = 15;
const SECONDS_PER_ITEM = 6;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function TickerItem({ alert }: { alert: SerializedAlert }) {
  const provider = PROVIDERS[alert.source];
  const severityColor = SEVERITY_COLORS[alert.severity as AlertSeverity];
  const providerColor = provider?.color
    ? ensureReadable(provider.color)
    : undefined;
  const sourceDomain = alert.url ? hostname(alert.url) : "";

  return (
    <span className="inline-flex items-center gap-2 px-4">
      {/* Severity dot */}
      <span
        className="h-[6px] w-[6px] shrink-0 rounded-full"
        style={{
          backgroundColor: severityColor?.fg,
          boxShadow: `0 0 6px ${severityColor?.fg}55`,
        }}
      />

      {/* Item body → internal incident page */}
      <Link
        href={`/incident/${alert.id}`}
        className="group inline-flex items-center gap-1.5 whitespace-nowrap"
      >
        <ProviderIcon providerKey={alert.source} size={13} />
        <span
          className="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: providerColor }}
        >
          {provider?.name ?? alert.source}
        </span>
        <span className="text-xs text-text-secondary transition-colors group-hover:text-text-primary">
          {truncate(alert.title, 80)}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
          {formatRelativeTime(alert.timestamp)}
        </span>
      </Link>

      {/* Verified source domain → official page */}
      {sourceDomain && (
        <a
          href={alert.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          title={`Verified source: ${sourceDomain}`}
        >
          <ExternalLink className="h-2.5 w-2.5" />
          {sourceDomain}
        </a>
      )}

      {/* Separator */}
      <span className="pl-3 text-border">▍</span>
    </span>
  );
}

export function NewsTicker() {
  const { alerts, isLoading } = useAlerts({ limit: 50, scope: "operations" });

  // Latest activity regardless of status — a news ticker reports what
  // just happened, resolved or not. Dedupe by source+title: some feeds
  // (e.g. M365) emit several alerts with identical headlines.
  const seen = new Set<string>();
  const items = [...alerts]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .filter((a) => {
      const key = `${a.source}:${a.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_ITEMS);

  if (isLoading || items.length === 0) return null;

  return (
    <div className="glass-card flex items-center overflow-hidden !py-0">
      {/* Label */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 self-stretch border-r border-border bg-[var(--header-bg)] px-3 py-2.5">
        <Radio className="h-3.5 w-3.5 text-primary" />
        <span className="hidden font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest text-primary sm:inline">
          Wire
        </span>
      </div>

      {/* Scrolling track (duplicated for a seamless loop) */}
      <div className="ticker-viewport relative flex-1 overflow-hidden">
        <div
          className="ticker-track items-center py-2"
          style={{ animationDuration: `${items.length * SECONDS_PER_ITEM}s` }}
        >
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="inline-flex items-center"
              aria-hidden={copy === 1}
            >
              {items.map((alert) => (
                <TickerItem key={`${copy}-${alert.id}`} alert={alert} />
              ))}
            </span>
          ))}
        </div>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--background)] to-transparent opacity-60" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent opacity-60" />
      </div>

      {/* Subscribe */}
      <a
        href="/feed.xml"
        title="Subscribe to this feed (RSS) — add ?source=aws or ?severity=critical to filter"
        className="z-10 flex shrink-0 items-center gap-1.5 self-stretch border-l border-border px-3 py-2.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest text-text-muted transition-colors hover:bg-[rgba(242,194,0,0.06)] hover:text-primary"
      >
        <Rss className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Subscribe</span>
      </a>
    </div>
  );
}
