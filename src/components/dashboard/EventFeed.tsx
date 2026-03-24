"use client";

import { useEffect, useRef } from "react";
import { Radio } from "lucide-react";
import { useEventFeed } from "@/hooks/useEventFeed";
import { ProviderIcon } from "./ProviderIcon";
import { PROVIDERS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { EventType } from "@/lib/polling/event-ring-buffer";

const EVENT_COLORS: Record<EventType, string> = {
  new: "#F2C200",
  updated: "#B8C0CC",
  resolved: "#48E0C7",
  escalated: "#ff6b6b",
  "de-escalated": "#48E0C7",
};

const EVENT_LABELS: Record<EventType, string> = {
  new: "New incident",
  updated: "Updated",
  resolved: "Resolved",
  escalated: "Escalated",
  "de-escalated": "De-escalated",
};

function truncateTitle(title: string, max = 60): string {
  if (title.length <= max) return title;
  return title.slice(0, max - 1) + "…";
}

function buildDescription(event: {
  type: EventType;
  source: string;
  title: string;
  severity: string;
  previousSeverity: string | null;
}): string {
  const provider = PROVIDERS[event.source]?.name ?? event.source;

  switch (event.type) {
    case "new":
      return `${provider} — new incident: ${truncateTitle(event.title)}`;
    case "resolved":
      return `${provider} — resolved: ${truncateTitle(event.title)}`;
    case "escalated":
      return `${provider} — escalated ${event.previousSeverity} → ${event.severity}`;
    case "de-escalated":
      return `${provider} — de-escalated ${event.previousSeverity} → ${event.severity}`;
    case "updated":
      return `${provider} — updated: ${truncateTitle(event.title)}`;
  }
}

export function EventFeed() {
  const { events } = useEventFeed(50);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (events.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = events.length;
  }, [events.length]);

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center">
          <Radio className="h-3.5 w-3.5 text-primary" />
        </div>
        <h2 className="section-label !mb-0">Live Event Feed</h2>
      </div>

      {events.length === 0 ? (
        <p className="py-6 text-center font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
          No recent activity
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="max-h-[300px] space-y-0.5 overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#232A35 transparent",
          }}
        >
          {events.map((event, i) => {
            const color = EVENT_COLORS[event.type];
            return (
              <div
                key={`${event.alertId}-${event.timestamp}-${i}`}
                className="flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
              >
                {/* Event type dot */}
                <span
                  className="mt-[5px] h-[6px] w-[6px] shrink-0 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }}
                />

                {/* Provider icon */}
                <ProviderIcon
                  providerKey={event.source}
                  size={13}
                  className="mt-[2px] shrink-0"
                />

                {/* Description */}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-tight text-text-secondary">
                    {buildDescription(event)}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="mt-[1px] shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                  {formatRelativeTime(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
