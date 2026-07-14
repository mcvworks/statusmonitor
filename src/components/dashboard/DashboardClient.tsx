"use client";

import { Suspense, useCallback, useState } from "react";
import { Rss } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { LiveIndicator } from "./LiveIndicator";
import { SearchFilter, type FilterValues } from "./SearchFilter";
import { AlertList } from "./AlertList";
import { StatusOverview } from "./StatusOverview";
import { BlastRadiusSummary } from "@/components/blast-radius/BlastRadiusSummary";
import { EventFeed } from "./EventFeed";
import { ProviderDetailPanel } from "./ProviderDetailPanel";

export function DashboardClient() {
  const { status } = useSSE();
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

  return (
    <>
      {/* Live indicator + search */}
      <div className="glass-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="section-label">Alert Feed</h2>
          <div className="flex items-center gap-3">
            <a
              href={
                filters.source
                  ? `/feed.xml?source=${encodeURIComponent(filters.source)}`
                  : "/feed.xml"
              }
              title="Subscribe to these alerts (RSS)"
              className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-primary"
            >
              <Rss className="h-3 w-3" />
              RSS
            </a>
            <LiveIndicator status={status} />
          </div>
        </div>
        <Suspense>
          <SearchFilter onChange={handleFilterChange} />
        </Suspense>
      </div>

      {/* Blast radius summary (shown when major providers have incidents) */}
      <BlastRadiusSummary />

      {/* Provider status grid */}
      <Suspense>
        <StatusOverview />
      </Suspense>

      {/* Provider detail — shown when a provider is selected in the
          sidebar or status grid */}
      {filters.source && (
        <Suspense>
          <ProviderDetailPanel source={filters.source} />
        </Suspense>
      )}

      {/* Live event feed */}
      <EventFeed source={filters.source || undefined} />

      {/* Alert feed */}
      <div id="alert-feed" />
      <AlertList
        scope="operations"
        category={filters.category}
        severity={filters.severity}
        status={filters.status}
        search={filters.search}
        source={filters.source}
        sort={filters.sort}
      />
    </>
  );
}
