"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { SerializedAlert } from "@/lib/alert-schema";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { PROVIDERS } from "@/lib/constants";
import { SeverityBadge } from "./SeverityBadge";

export function AlertCard({ alert }: { alert: SerializedAlert }) {
  const [expanded, setExpanded] = useState(false);
  const isResolved = alert.status === "resolved";
  const providerName = PROVIDERS[alert.source]?.name ?? alert.source;

  return (
    <div
      className={`glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isResolved ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            {isResolved && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-secondary">
                Resolved
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium text-text-primary">
            {alert.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
            <span>{providerName}</span>
            {alert.region && (
              <>
                <span className="text-border">|</span>
                <span>{alert.region}</span>
              </>
            )}
            <span className="text-border">|</span>
            <span>{formatRelativeTime(alert.timestamp)}</span>
          </div>

          {alert.description && (
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {expanded
                ? alert.description
                : truncate(alert.description, 140)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {alert.url && (
            <a
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label="View source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {alert.description && alert.description.length > 140 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
