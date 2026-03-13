import type { AlertSeverity } from "@/lib/alert-schema";
import { SEVERITY_COLORS } from "@/lib/constants";

const LABELS: Record<AlertSeverity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Info",
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const colors = SEVERITY_COLORS[severity];

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider"
      style={{ color: colors.fg, backgroundColor: colors.bg }}
    >
      <span
        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.fg }}
      />
      {LABELS[severity]}
    </span>
  );
}
