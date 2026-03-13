"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Cloud,
  Wrench,
  Shield,
  Wifi,
  ChevronDown,
  Layers,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  PROVIDERS,
  CATEGORY_LABELS,
  type ProviderMeta,
} from "@/lib/constants";
import type { AlertCategory } from "@/lib/alert-schema";

const CATEGORY_ICONS: Record<AlertCategory, React.ReactNode> = {
  cloud: <Cloud className="h-3.5 w-3.5" />,
  devops: <Wrench className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  isp: <Wifi className="h-3.5 w-3.5" />,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: session } = useSession();

  // Group providers by category
  const grouped = Object.entries(PROVIDERS).reduce(
    (acc, [id, meta]) => {
      if (!acc[meta.category]) acc[meta.category] = [];
      acc[meta.category].push({ id, ...meta });
      return acc;
    },
    {} as Record<AlertCategory, (ProviderMeta & { id: string })[]>
  );

  const categories: AlertCategory[] = ["cloud", "devops", "security", "isp"];

  return (
    <aside
      className={`hidden flex-shrink-0 border-r border-border bg-[rgba(15,17,20,0.5)] transition-[width] duration-200 lg:block ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Toggle */}
        <div className={`flex items-center border-b border-border px-3 py-2 ${collapsed ? "justify-center" : "justify-end"}`}>
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto py-2">
          {!collapsed &&
            categories.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                providers={grouped[cat] ?? []}
              />
            ))}
          {collapsed &&
            categories.map((cat) => (
              <div key={cat} className="flex justify-center py-2" title={CATEGORY_LABELS[cat]}>
                <span className="text-text-muted">{CATEGORY_ICONS[cat]}</span>
              </div>
            ))}
        </nav>

        {/* Auth-only links */}
        {session?.user && !collapsed && (
          <div className="border-t border-border p-3">
            <SidebarLink href="/dashboard/my-stack" icon={<Layers className="h-4 w-4" />}>
              My Stack
            </SidebarLink>
            <SidebarLink href="/dashboard/settings" icon={<Settings className="h-4 w-4" />}>
              Settings
            </SidebarLink>
          </div>
        )}
      </div>
    </aside>
  );
}

function CategorySection({
  category,
  providers,
}: {
  category: AlertCategory;
  providers: (ProviderMeta & { id: string })[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="px-3 py-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="section-label mb-1 w-full cursor-pointer hover:text-text-secondary"
      >
        {CATEGORY_ICONS[category]}
        <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
      </button>

      {expanded && (
        <ul className="space-y-0.5 pl-3">
          {providers.map((p) => (
            <li key={p.id}>
              <span className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
                <span className="status-dot status-dot-operational" />
                {p.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}
