"use client";

import { ExternalLink } from "lucide-react";
import type { AffectedService } from "@/lib/dependencies/resolver";

const CONFIDENCE_STYLES = {
  confirmed: {
    dot: "bg-[#ff6b6b]",
    glow: "shadow-[0_0_4px_rgba(255,107,107,0.4)]",
    label: "Confirmed",
    labelColor: "text-[#ff6b6b]",
  },
  likely: {
    dot: "bg-[#FA6216]",
    glow: "shadow-[0_0_4px_rgba(250,98,22,0.4)]",
    label: "Likely",
    labelColor: "text-[#FA6216]",
  },
  possible: {
    dot: "bg-text-muted",
    glow: "",
    label: "Possible",
    labelColor: "text-text-muted",
  },
};

function getEffectiveConfidence(service: AffectedService): AffectedService["confidence"] {
  if (service.hasActiveAlert) return "confirmed";
  return service.confidence;
}

export function DependencyList({ services }: { services: AffectedService[] }) {
  if (services.length === 0) return null;

  // Sort: confirmed first, then likely, then possible
  const order = { confirmed: 0, likely: 1, possible: 2 };
  const sorted = [...services].sort((a, b) => {
    const ca = getEffectiveConfidence(a);
    const cb = getEffectiveConfidence(b);
    return order[ca] - order[cb];
  });

  // Group by effective confidence
  const groups = {
    confirmed: sorted.filter((s) => getEffectiveConfidence(s) === "confirmed"),
    likely: sorted.filter((s) => getEffectiveConfidence(s) === "likely"),
    possible: sorted.filter((s) => getEffectiveConfidence(s) === "possible"),
  };

  return (
    <div className="space-y-3">
      {(["confirmed", "likely", "possible"] as const).map((level) => {
        const items = groups[level];
        if (items.length === 0) return null;
        const style = CONFIDENCE_STYLES[level];

        return (
          <div key={level}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot} ${style.glow}`} />
              <span className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${style.labelColor}`}>
                {style.label} ({items.length})
              </span>
            </div>
            <div className="space-y-1 pl-3">
              {items.map((svc) => (
                <div
                  key={svc.service}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary">{svc.service}</span>
                    {svc.hasActiveAlert && (
                      <span className="rounded bg-[rgba(255,107,107,0.12)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase text-[#ff6b6b]">
                        Active Alert
                      </span>
                    )}
                    {svc.regions && svc.regions.length > 0 && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-muted">
                        {svc.regions.join(", ")}
                      </span>
                    )}
                  </div>
                  {svc.source && (
                    <a
                      href={svc.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-text-muted transition-colors hover:text-text-primary"
                      aria-label={`Source for ${svc.service}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
