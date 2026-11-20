"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { Rss } from "lucide-react";
import { SWRConfig } from "swr";
import { useSSE } from "@/hooks/useSSE";
import {
  DASHBOARD_SUMMARY_KEY,
  useDashboardSummary,
} from "@/hooks/useDashboardSummary";
import type { SummarySample } from "@/lib/dashboard-summary-clock";
import { LiveIndicator } from "./LiveIndicator";
import { SearchFilter, type FilterValues } from "./SearchFilter";
import { AlertList } from "./AlertList";
import { StatusOverview } from "./StatusOverview";
import { BlastRadiusSummary } from "@/components/blast-radius/BlastRadiusSummary";
import { EventFeed } from "./EventFeed";
import { HealthBanner } from "./HealthBanner";
import { NewsTicker } from "./NewsTicker";
import { ProviderDetailPanel } from "./ProviderDetailPanel";

interface DashboardClientProps {
  /** Server snapshot for the first render; null if it could not be read. */
  initialSummary: SummarySample | null;
  /** Email signup, rendered at the end of the rail. */
  children?: React.ReactNode;
}

export function DashboardClient({
  initialSummary,
  children,
}: DashboardClientProps) {
  // The server snapshot paints first; the live stream and the periodic
  // refresh inside useDashboardSummary keep it current from then on.
  const fallback = useMemo(
    () =>
      initialSummary ? { [DASHBOARD_SUMMARY_KEY]: initialSummary } : {},
    [initialSummary],
  );

  return (
    <SWRConfig value={{ fallback }}>
      <Console>{children}</Console>
    </SWRConfig>
  );
}

function Console({ children }: { children?: React.ReactNode }) {
  const { status } = useSSE();
  const { summary, isLastKnown } = useDashboardSummary();
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    category: "",
    severity: "",
    status: "",
    source: "",
    sort: "",
  });

  const handleFilterChange = useCallback((next: FilterValues) => {
    setFilters(next);
  }, []);

  // Providers with a current incident, independent of the feed's page.
  // Null while that is not known, so nothing is claimed in the meantime.
  const affectedProviders = useMemo(
    () =>
      summary && !isLastKnown
        ? summary.affected.map((row) => row.source)
        : null,
    [summary, isLastKnown],
  );

  return (
    <div className="console @container space-y-4">
      {/* Opening summary: tiles + affected now */}
      <HealthBanner sseStatus={status} />

      {/* Live incident wire */}
      <NewsTicker />

      {/* Two columns as soon as the feed keeps a phone-width column next to
          the rail (a 1024px window with the sidebar open); a wider rail once
          there is room. */}
      <div className="grid items-start gap-4 @2xl:grid-cols-[minmax(0,1fr)_300px] @[50rem]:grid-cols-[minmax(0,1fr)_360px]">
        {/* Alert feed: on a phone the whole feed comes before the rail */}
        <section
          id="alert-feed"
          aria-labelledby="alert-feed-title"
          className="min-w-0 scroll-mt-28 space-y-4"
        >
          <div className="glass-card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="alert-feed-title" className="section-label">
                Alert feed
              </h2>
              <div className="flex items-center gap-3">
                <a
                  href={
                    filters.source
                      ? `/feed.xml?source=${encodeURIComponent(filters.source)}`
                      : "/feed.xml"
                  }
                  title="Subscribe to these alerts (RSS)"
                  className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-muted transition-colors hover:text-primary-ink"
                >
                  <Rss className="h-3 w-3" aria-hidden="true" />
                  RSS
                </a>
                <LiveIndicator status={status} />
              </div>
            </div>
            <Suspense>
              <SearchFilter onChange={handleFilterChange} showSeverityShortcuts />
            </Suspense>
          </div>

          {/* Blast radius summary (shown when major providers have incidents) */}
          <BlastRadiusSummary providers={affectedProviders} />

          {/* Provider detail — shown when a provider filter is selected */}
          {filters.source && (
            <Suspense>
              <ProviderDetailPanel source={filters.source} />
            </Suspense>
          )}

          <AlertList
            scope="operations"
            category={filters.category}
            severity={filters.severity}
            status={filters.status}
            search={filters.search}
            source={filters.source}
            sort={filters.sort}
            showCount
          />
        </section>

        {/* Rail: problem sources first, then everything else */}
        <aside
          aria-label="Provider status, live events and email alerts"
          className="min-w-0 space-y-4"
        >
          <StatusOverview variant="rail" />

          {/* Live event feed */}
          <EventFeed source={filters.source || undefined} />

          {children}
        </aside>
      </div>
    </div>
  );
}
