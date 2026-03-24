"use client";

interface CvssData {
  score: number;
  severity: string | null;
  vector: string | null;
  attackVector: string | null;
  attackComplexity: string | null;
  privilegesRequired: string | null;
  userInteraction: string | null;
  scope: string | null;
  confidentialityImpact: string | null;
  integrityImpact: string | null;
  availabilityImpact: string | null;
}

interface CvssBreakdownProps {
  cvss: CvssData;
}

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "#ff6b6b",
  LOW: "#F2C200",
  NONE: "#48E0C7",
  CHANGED: "#FA6216",
  UNCHANGED: "#48E0C7",
  NETWORK: "#ff6b6b",
  ADJACENT_NETWORK: "#FA6216",
  LOCAL: "#F2C200",
  PHYSICAL: "#48E0C7",
  REQUIRED: "#48E0C7",
};

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  const display = value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const color = IMPACT_COLORS[value] ?? "#8892A0";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider"
      style={{
        color,
        backgroundColor: `${color}10`,
        border: `1px solid ${color}20`,
      }}
    >
      <span className="text-text-muted">{label}:</span>
      {display}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 9 ? "#ff6b6b" : score >= 7 ? "#FA6216" : score >= 4 ? "#F2C200" : "#48E0C7";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="font-[family-name:var(--font-mono)] text-[11px] font-semibold"
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export function CvssBreakdown({ cvss }: CvssBreakdownProps) {
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">
          CVSS
        </span>
        <ScoreBar score={cvss.score} />
      </div>
      <div className="flex flex-wrap gap-1">
        <MetricPill label="AV" value={cvss.attackVector} />
        <MetricPill label="AC" value={cvss.attackComplexity} />
        <MetricPill label="PR" value={cvss.privilegesRequired} />
        <MetricPill label="UI" value={cvss.userInteraction} />
        <MetricPill label="C" value={cvss.confidentialityImpact} />
        <MetricPill label="I" value={cvss.integrityImpact} />
        <MetricPill label="A" value={cvss.availabilityImpact} />
      </div>
    </div>
  );
}
