"use client";

import { useState } from "react";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useProviderDependencies } from "@/hooks/useDependencies";
import { DependencyList } from "./DependencyList";

// Providers that have entries in the static dependency map
const BLAST_RADIUS_PROVIDERS = new Set(["aws", "azure", "gcp", "cloudflare", "fastly"]);

export function hasBlastRadius(source: string): boolean {
  return BLAST_RADIUS_PROVIDERS.has(source);
}

export function BlastRadiusPanel({ provider }: { provider: string }) {
  const [expanded, setExpanded] = useState(false);
  const { services, isLoading } = useProviderDependencies(provider);

  if (services.length === 0 && !isLoading) return null;

  const confirmedCount = services.filter((s) => s.hasActiveAlert).length;
  const totalCount = services.length;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
      >
        <Zap className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {totalCount} service{totalCount !== 1 ? "s" : ""} potentially affected
        </span>
        {confirmedCount > 0 && (
          <span className="rounded bg-[rgba(255,107,107,0.12)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-[#ff6b6b]">
            {confirmedCount} confirmed
          </span>
        )}
        <span className="ml-auto text-text-muted">
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5 rounded-lg border border-border bg-surface-input p-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-surface-hover" />
              ))}
            </div>
          ) : (
            <DependencyList services={services} />
          )}
        </div>
      )}
    </div>
  );
}
