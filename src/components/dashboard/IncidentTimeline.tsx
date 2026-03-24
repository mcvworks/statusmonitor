"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface IncidentUpdate {
  body: string;
  status: string;
  timestamp: string;
}

interface IncidentTimelineProps {
  updates: IncidentUpdate[];
}

const STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
  postmortem: "Post-mortem",
  update: "Update",
};

const STATUS_COLORS: Record<string, string> = {
  investigating: "#ff6b6b",
  identified: "#FA6216",
  monitoring: "#F2C200",
  resolved: "#48E0C7",
  postmortem: "#48E0C7",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function IncidentTimeline({ updates }: IncidentTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (!updates || updates.length <= 1) return null;

  // Updates come newest-first from Statuspage; show chronologically
  const sorted = [...updates].reverse();

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-text-secondary"
      >
        {expanded ? (
          <ChevronDown className="h-2.5 w-2.5" />
        ) : (
          <ChevronRight className="h-2.5 w-2.5" />
        )}
        {updates.length} updates
      </button>

      {expanded && (
        <div className="relative ml-1 mt-2 border-l border-border pl-4">
          {sorted.map((update, i) => {
            const color = STATUS_COLORS[update.status] ?? "#8892A0";
            const isLast = i === sorted.length - 1;
            return (
              <div key={i} className={`relative ${isLast ? "" : "pb-3"}`}>
                {/* Timeline dot */}
                <span
                  className="absolute -left-[21px] top-[3px] h-[7px] w-[7px] rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }}
                />
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase"
                    style={{ color }}
                  >
                    {STATUS_LABELS[update.status] ?? update.status}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                    {formatTime(update.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
                  {update.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
