"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  mobile?: boolean;
}

export function Sidebar({ collapsed, onToggle, mobile }: SidebarProps) {
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

  // Inner content shared between desktop and mobile
  const content = (
    <div className="flex h-full flex-col">
      {/* Toggle */}
      <div className={`flex items-center border-b border-border px-3 py-2 ${collapsed && !mobile ? "justify-center" : "justify-end"}`}>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label={mobile ? "Close sidebar" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {mobile ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto py-2">
        {(!collapsed || mobile) &&
          categories.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              providers={grouped[cat] ?? []}
            />
          ))}
        {collapsed && !mobile &&
          categories.map((cat) => (
            <div key={cat} className="flex justify-center py-2" title={CATEGORY_LABELS[cat]}>
              <span className="text-text-muted">{CATEGORY_ICONS[cat]}</span>
            </div>
          ))}
      </nav>

      {/* Auth-only links */}
      {session?.user && (!collapsed || mobile) && (
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
  );

  // Mobile: render just the inner content (wrapper is in AppShell)
  if (mobile) return content;

  return (
    <aside
      className={`hidden flex-shrink-0 border-r border-border bg-[var(--sidebar-bg)] transition-[width] duration-200 lg:block ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      {content}
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSource = searchParams.get("source") ?? "";

  const handleProviderClick = (providerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeSource === providerId) {
      params.delete("source");
    } else {
      params.set("source", providerId);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

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
              <button
                onClick={() => handleProviderClick(p.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors ${
                  activeSource === p.id
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                <span className="status-dot status-dot-operational" />
                {p.name}
              </button>
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
