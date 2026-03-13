"use client";

import { Suspense, useCallback, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { LiveIndicator } from "./LiveIndicator";
import { SearchFilter, type FilterValues } from "./SearchFilter";
import { AlertList } from "./AlertList";
import { StatusOverview } from "./StatusOverview";

export function DashboardClient() {
  const { status } = useSSE();
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    category: "",
    severity: "",
    status: "",
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
          <LiveIndicator status={status} />
        </div>
        <Suspense>
          <SearchFilter onChange={handleFilterChange} />
        </Suspense>
      </div>

      {/* Provider status grid */}
      <StatusOverview />

      {/* Alert feed */}
      <AlertList
        category={filters.category}
        severity={filters.severity}
        status={filters.status}
        search={filters.search}
      />
    </>
  );
}
