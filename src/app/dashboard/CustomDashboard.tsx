"use client";

import { Suspense, useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import {
  useDashboardViews,
  type DashboardView,
} from "@/hooks/useDashboardViews";
import { LiveIndicator } from "@/components/dashboard/LiveIndicator";
import { SearchFilter, type FilterValues } from "@/components/dashboard/SearchFilter";
import { AlertList } from "@/components/dashboard/AlertList";
import { StatusOverview } from "@/components/dashboard/StatusOverview";
import { BlastRadiusSummary } from "@/components/blast-radius/BlastRadiusSummary";
import { SavedViewSwitcher } from "@/components/dashboard/SavedViewSwitcher";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { PinnedServices } from "@/components/dashboard/PinnedServices";

export function CustomDashboard() {
  const { status } = useSSE();
  const { views, createView, updateView, deleteView } = useDashboardViews();

  const [activeViewId, setActiveViewId] = useState<string | null>(() => {
    // Will be updated once views load
    return null;
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingView, setEditingView] = useState<DashboardView | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    category: "",
    severity: "",
    status: "",
  });

  // Resolve active view — use default if one exists and no explicit selection
  const resolvedActiveId =
    activeViewId ?? views.find((v) => v.isDefault)?.id ?? null;
  const activeView = views.find((v) => v.id === resolvedActiveId) ?? null;

  // Derive filter props from active view
  const viewSelectedServices = activeView?.layout.selectedServices;
  const viewPinnedServices = activeView?.pinnedServices ?? [];
  const viewSourceFilter =
    viewSelectedServices && viewSelectedServices.length > 0
      ? viewSelectedServices
      : undefined;

  const handleFilterChange = useCallback((next: FilterValues) => {
    setFilters(next);
  }, []);

  const handleSave = useCallback(
    async (config: {
      name: string;
      selectedServices: string[];
      pinnedServices: string[];
      filters: { category?: string; severity?: string; status?: string };
      isDefault: boolean;
    }) => {
      setSaving(true);
      try {
        if (editingView) {
          await updateView(editingView.id, config);
        } else {
          const created = await createView(config);
          setActiveViewId(created.id);
        }
        setShowCustomizer(false);
        setEditingView(null);
      } finally {
        setSaving(false);
      }
    },
    [editingView, createView, updateView],
  );

  const handleEdit = useCallback((view: DashboardView) => {
    setEditingView(view);
    setShowCustomizer(true);
  }, []);

  const handleDelete = useCallback(
    async (viewId: string) => {
      await deleteView(viewId);
      if (activeViewId === viewId) {
        setActiveViewId(null);
      }
    },
    [deleteView, activeViewId],
  );

  return (
    <>
      {/* View switcher + controls */}
      <div className="glass-card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="section-label">My Dashboard</h2>
            <SavedViewSwitcher
              views={views}
              activeViewId={resolvedActiveId}
              onSelect={setActiveViewId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingView(null);
                setShowCustomizer(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              New View
            </button>
            <LiveIndicator status={status} />
          </div>
        </div>
        <Suspense>
          <SearchFilter onChange={handleFilterChange} />
        </Suspense>
      </div>

      {/* Customizer panel (create/edit) */}
      {showCustomizer && (
        <DashboardCustomizer
          initialName={editingView?.name}
          initialSelectedServices={editingView?.layout.selectedServices}
          initialPinnedServices={editingView?.pinnedServices}
          initialFilters={editingView?.filters}
          initialIsDefault={editingView?.isDefault}
          onSave={handleSave}
          onCancel={() => {
            setShowCustomizer(false);
            setEditingView(null);
          }}
          saving={saving}
        />
      )}

      {/* Pinned services (from active view) */}
      <PinnedServices pinnedServiceKeys={viewPinnedServices} />

      {/* Blast radius summary */}
      <BlastRadiusSummary />

      {/* Provider status grid — filtered by view */}
      <StatusOverview sourceFilter={viewSourceFilter} />

      {/* Alert feed — filtered by view + search/filters */}
      <AlertList
        category={filters.category}
        severity={filters.severity}
        status={filters.status}
        search={filters.search}
        sourceFilter={viewSourceFilter}
      />
    </>
  );
}
