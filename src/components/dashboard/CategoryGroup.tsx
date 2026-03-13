import type { AlertCategory, SerializedAlert } from "@/lib/alert-schema";
import { CATEGORY_LABELS } from "@/lib/constants";
import { AlertCard } from "./AlertCard";

interface CategoryGroupProps {
  category: AlertCategory;
  alerts: SerializedAlert[];
}

export function CategoryGroup({ category, alerts }: CategoryGroupProps) {
  if (alerts.length === 0) return null;

  return (
    <div>
      <div className="section-label mb-3">
        {CATEGORY_LABELS[category]}
        <span className="ml-1 text-text-muted">({alerts.length})</span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
