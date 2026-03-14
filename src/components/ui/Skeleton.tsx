interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-hover ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton for an alert card */
export function AlertCardSkeleton() {
  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Skeleton for the status overview grid */
export function StatusOverviewSkeleton() {
  return (
    <div className="glass-card p-4">
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for sidebar provider list */
export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-3">
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for history table rows */
export function HistoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
