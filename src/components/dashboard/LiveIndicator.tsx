"use client";

import type { SSEStatus } from "@/hooks/useSSE";

const STATUS_CONFIG: Record<
  SSEStatus,
  { dotClass: string; label: string; tooltip: string }
> = {
  connected: {
    dotClass: "bg-secondary shadow-[0_0_6px_rgba(72,224,199,0.5)]",
    label: "LIVE",
    tooltip: "Connected — receiving real-time updates",
  },
  connecting: {
    dotClass: "bg-minor animate-pulse",
    label: "CONNECTING",
    tooltip: "Connecting to real-time feed…",
  },
  disconnected: {
    dotClass: "bg-text-muted",
    label: "OFFLINE",
    tooltip: "Disconnected — updates paused",
  },
};

export function LiveIndicator({ status }: { status: SSEStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2" title={config.tooltip}>
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass} ${
          status === "connected" ? "animate-pulse" : ""
        }`}
      />
      <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
        {config.label}
      </span>
    </div>
  );
}
