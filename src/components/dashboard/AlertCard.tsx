"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Clock,
  X,
  Undo2,
} from "lucide-react";
import type { SerializedAlertWithState } from "@/lib/alert-schema";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { PROVIDERS } from "@/lib/constants";
import { SeverityBadge } from "./SeverityBadge";
import {
  BlastRadiusPanel,
  hasBlastRadius,
} from "@/components/blast-radius/BlastRadiusPanel";
import { useAlertActions } from "@/hooks/useAlertActions";

const SNOOZE_OPTIONS = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "1 hr", ms: 60 * 60 * 1000 },
  { label: "4 hr", ms: 4 * 60 * 60 * 1000 },
  { label: "24 hr", ms: 24 * 60 * 60 * 1000 },
];

interface AlertCardProps {
  alert: SerializedAlertWithState;
  showActions?: boolean;
}

export function AlertCard({ alert, showActions = true }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const { data: session } = useSession();
  const { acknowledge, snooze, dismiss, clear } = useAlertActions();

  const isResolved = alert.status === "resolved";
  const providerName = PROVIDERS[alert.source]?.name ?? alert.source;
  const isAuthenticated = !!session?.user;
  const userState = alert.userState;
  const isAcknowledged = userState?.state === "acknowledged";

  const handleSnooze = async (ms: number) => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is in an event handler, not during render
    const until = new Date(Date.now() + ms).toISOString();
    await snooze(alert.id, until);
    setSnoozeOpen(false);
  };

  return (
    <div
      className={`glass-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isResolved ? "opacity-50" : ""
      } ${isAcknowledged ? "opacity-60" : ""}`}
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
            {isAcknowledged && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-primary">
                Acknowledged
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

          {!isResolved && hasBlastRadius(alert.source) && (
            <BlastRadiusPanel provider={alert.source} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Alert action buttons (auth only) */}
          {isAuthenticated && showActions && !isResolved && (
            <>
              {userState ? (
                <button
                  onClick={() => clear(alert.id)}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                  aria-label="Undo"
                  title="Undo"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-secondary/10 hover:text-secondary"
                    aria-label="Acknowledge"
                    title="Acknowledge"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setSnoozeOpen(!snoozeOpen)}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="Snooze"
                      title="Snooze"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                    {snoozeOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] rounded-lg border border-border bg-card-solid p-1 shadow-lg">
                        {SNOOZE_OPTIONS.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleSnooze(opt.ms)}
                            className="block w-full rounded-md px-3 py-1.5 text-left font-[family-name:var(--font-mono)] text-[11px] text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-critical/10 hover:text-critical"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          )}

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
