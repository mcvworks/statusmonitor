"use client";

import { useState, useCallback, Suspense } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Header onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <Suspense>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </Suspense>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-[var(--sidebar-bg)] backdrop-blur-xl lg:hidden">
              <Suspense>
                <Sidebar
                  collapsed={false}
                  onToggle={closeMobileSidebar}
                  mobile
                />
              </Suspense>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
