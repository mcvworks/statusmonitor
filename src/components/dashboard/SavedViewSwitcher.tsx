"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Star, Pencil, Trash2, LayoutGrid } from "lucide-react";
import type { DashboardView } from "@/hooks/useDashboardViews";

interface SavedViewSwitcherProps {
  views: DashboardView[];
  activeViewId: string | null;
  onSelect: (viewId: string | null) => void;
  onEdit: (view: DashboardView) => void;
  onDelete: (viewId: string) => void;
}

export function SavedViewSwitcher({
  views,
  activeViewId,
  onSelect,
  onEdit,
  onDelete,
}: SavedViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeView = views.find((v) => v.id === activeViewId);
  const label = activeView?.name ?? "Default View";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-hover"
      >
        <LayoutGrid className="h-4 w-4 text-primary" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-border bg-surface p-1 shadow-lg backdrop-blur-xl">
          {/* Default view */}
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
              !activeViewId ? "text-primary" : "text-text-secondary"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Default View</span>
            {!activeViewId && (
              <span className="ml-auto text-[10px] text-primary">Active</span>
            )}
          </button>

          {views.length > 0 && (
            <div className="my-1 border-t border-border" />
          )}

          {views.map((view) => (
            <div
              key={view.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover ${
                view.id === activeViewId
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              <button
                className="flex flex-1 items-center gap-2 text-left text-sm"
                onClick={() => {
                  onSelect(view.id);
                  setOpen(false);
                }}
              >
                {view.isDefault && (
                  <Star className="h-3 w-3 fill-primary text-primary" />
                )}
                <span className="truncate">{view.name}</span>
                {view.id === activeViewId && (
                  <span className="ml-auto text-[10px] text-primary">
                    Active
                  </span>
                )}
              </button>

              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(view);
                    setOpen(false);
                  }}
                  className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
                  title="Edit view"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(view.id);
                  }}
                  className="rounded p-1 text-text-muted hover:bg-surface hover:text-critical"
                  title="Delete view"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
