"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { CommunityThread } from "@/lib/enrichment/community-threads";

const MAJOR_PROVIDERS = new Set([
  "aws", "azure", "gcp", "cloudflare", "github",
]);

interface CommunityThreadsProps {
  provider: string;
  isActive: boolean;
}

function HNIcon() {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-[9px] font-bold leading-none"
      style={{ backgroundColor: "#FF6600", color: "#fff" }}
    >
      Y
    </span>
  );
}

function RedditIcon() {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold leading-none"
      style={{ backgroundColor: "#FF4500", color: "#fff" }}
    >
      r/
    </span>
  );
}

function truncateTitle(title: string, max = 80): string {
  if (title.length <= max) return title;
  return title.slice(0, max - 1) + "…";
}

export function CommunityThreads({ provider, isActive }: CommunityThreadsProps) {
  const [expanded, setExpanded] = useState(false);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loaded, setLoaded] = useState(false);

  const shouldFetch = MAJOR_PROVIDERS.has(provider) && isActive;

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;
    fetch(`/api/enrichment/threads?provider=${encodeURIComponent(provider)}`)
      .then((res) => (res.ok ? res.json() : { threads: [] }))
      .then((data) => {
        if (!cancelled) {
          setThreads(data.threads ?? []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [provider, shouldFetch]);

  if (!shouldFetch || !loaded || threads.length === 0) return null;

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
        {threads.length} community thread{threads.length !== 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 pl-1">
          {threads.map((thread, i) => (
            <a
              key={i}
              href={thread.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
            >
              {thread.source === "hn" ? <HNIcon /> : <RedditIcon />}
              <div className="min-w-0 flex-1">
                <span className="text-[11px] leading-tight text-text-secondary group-hover:text-text-primary">
                  {truncateTitle(thread.title)}
                </span>
                <div className="mt-0.5 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                  <span>{thread.score} pts</span>
                  <span className="text-border">·</span>
                  <span>{thread.commentCount} comments</span>
                </div>
              </div>
              <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
