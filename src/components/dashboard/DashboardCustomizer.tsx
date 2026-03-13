"use client";

import { useState, useCallback } from "react";
import {
  X,
  Save,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  PROVIDERS,
  CATEGORY_LABELS,
  type ProviderMeta,
} from "@/lib/constants";
import type { AlertCategory } from "@/lib/alert-schema";

interface DashboardCustomizerProps {
  initialName?: string;
  initialSelectedServices?: string[];
  initialPinnedServices?: string[];
  initialFilters?: {
    category?: string;
    severity?: string;
    status?: string;
  };
  initialIsDefault?: boolean;
  onSave: (config: {
    name: string;
    selectedServices: string[];
    pinnedServices: string[];
    filters: { category?: string; severity?: string; status?: string };
    isDefault: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

type GroupedProviders = Record<string, { key: string; meta: ProviderMeta }[]>;

function groupProviders(): GroupedProviders {
  const groups: GroupedProviders = {};
  for (const [key, meta] of Object.entries(PROVIDERS)) {
    if (!groups[meta.category]) groups[meta.category] = [];
    groups[meta.category].push({ key, meta });
  }
  return groups;
}

const CATEGORY_ORDER: AlertCategory[] = [
  "cloud",
  "devops",
  "security",
  "isp",
];

export function DashboardCustomizer({
  initialName = "",
  initialSelectedServices,
  initialPinnedServices = [],
  initialFilters = {},
  initialIsDefault = false,
  onSave,
  onCancel,
  saving = false,
}: DashboardCustomizerProps) {
  const allProviderKeys = Object.keys(PROVIDERS);
  const grouped = groupProviders();

  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelectedServices ?? allProviderKeys),
  );
  const [pinned, setPinned] = useState<Set<string>>(
    new Set(initialPinnedServices),
  );
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER),
  );

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleService = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setPinned((p) => {
          const np = new Set(p);
          np.delete(key);
          return np;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const togglePin = useCallback(
    (key: string) => {
      if (!selected.has(key)) return;
      setPinned((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [selected],
  );

  const selectAll = useCallback(() => {
    setSelected(new Set(allProviderKeys));
  }, [allProviderKeys]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
    setPinned(new Set());
  }, []);

  const selectCategory = useCallback(
    (cat: string) => {
      const keys = grouped[cat]?.map((p) => p.key) ?? [];
      setSelected((prev) => {
        const next = new Set(prev);
        for (const k of keys) next.add(k);
        return next;
      });
    },
    [grouped],
  );

  const deselectCategory = useCallback(
    (cat: string) => {
      const keys = new Set(grouped[cat]?.map((p) => p.key) ?? []);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const k of keys) next.delete(k);
        return next;
      });
      setPinned((prev) => {
        const next = new Set(prev);
        for (const k of keys) next.delete(k);
        return next;
      });
    },
    [grouped],
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      selectedServices: Array.from(selected),
      pinnedServices: Array.from(pinned),
      filters: initialFilters,
      isDefault,
    });
  };

  return (
    <div className="glass-card corner-brackets space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="section-label">
          {initialName ? "Edit View" : "Create View"}
        </h3>
        <button
          onClick={onCancel}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Name input */}
      <div>
        <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-muted">
          View Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Production, Dev Tools, Security Only"
          className="w-full rounded-lg border border-border bg-surface-input px-3 py-2 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Default toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <button
          onClick={() => setIsDefault(!isDefault)}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            isDefault
              ? "border-primary bg-primary text-[#0F1114]"
              : "border-border bg-surface-input text-transparent"
          }`}
        >
          <Star className="h-3 w-3" />
        </button>
        <span className="text-sm text-text-secondary">
          Set as default view
        </span>
      </label>

      {/* Service picker */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-text-muted">
            Services ({selected.size}/{allProviderKeys.length})
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:text-primary-hover"
            >
              All
            </button>
            <span className="text-xs text-text-muted">/</span>
            <button
              onClick={selectNone}
              className="text-xs text-primary hover:text-primary-hover"
            >
              None
            </button>
          </div>
        </div>

        <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-input p-2">
          {CATEGORY_ORDER.map((cat) => {
            const providers = grouped[cat] ?? [];
            const selectedInCat = providers.filter((p) =>
              selected.has(p.key),
            ).length;
            const allSelected = selectedInCat === providers.length;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="flex flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                    )}
                    <span>
                      {CATEGORY_LABELS[cat as AlertCategory] ?? cat}
                    </span>
                    <span className="ml-1 text-xs text-text-muted">
                      ({selectedInCat}/{providers.length})
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      allSelected
                        ? deselectCategory(cat)
                        : selectCategory(cat)
                    }
                    className="rounded px-2 py-1 text-[10px] text-primary hover:bg-surface-hover"
                  >
                    {allSelected ? "Deselect" : "Select"} all
                  </button>
                </div>

                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {providers.map(({ key, meta }) => {
                      const isSelected = selected.has(key);
                      const isPinned = pinned.has(key);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-surface-hover"
                        >
                          <button
                            onClick={() => toggleService(key)}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-[#0F1114]"
                                : "border-border bg-surface-input"
                            }`}
                          >
                            {isSelected && "✓"}
                          </button>
                          <span
                            className={`flex-1 text-sm ${isSelected ? "text-text-primary" : "text-text-muted"}`}
                          >
                            {meta.name}
                          </span>
                          {isSelected && (
                            <button
                              onClick={() => togglePin(key)}
                              className={`rounded p-0.5 transition-colors ${
                                isPinned
                                  ? "text-primary"
                                  : "text-text-muted opacity-0 group-hover:opacity-100 hover:text-primary"
                              }`}
                              title={isPinned ? "Unpin" : "Pin to top"}
                              style={{ opacity: isPinned ? 1 : undefined }}
                            >
                              {isPinned ? (
                                <PinOff className="h-3.5 w-3.5" />
                              ) : (
                                <Pin className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[#0F1114] transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save View"}
        </button>
      </div>
    </div>
  );
}
