"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Activity, Clock, Menu, X, Sun, Moon } from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSSE } from "@/hooks/useSSE";

interface HeaderProps {
  onMenuToggle?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const SSE_DOT: Record<string, string> = {
  connected: "bg-secondary shadow-[0_0_6px_rgba(72,224,199,0.5)]",
  connecting: "bg-minor animate-pulse",
  disconnected: "bg-text-muted",
};

const SSE_LABEL: Record<string, string> = {
  connected: "LIVE",
  connecting: "CONNECTING",
  disconnected: "OFFLINE",
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolved, toggle } = useDarkMode();
  const { status, lastEventAt } = useSSE();

  return (
    <header className="sticky top-0 z-40">
      {/* Floating pill navbar */}
      <div className="px-4 pt-3 pb-0 lg:px-6">
        <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-[20px] border border-border bg-[var(--header-bg)] px-5 py-2.5 backdrop-blur-[18px] backdrop-saturate-[1.3]">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-base font-bold tracking-[1.5px] text-primary"
            >
              <Image
                src="/dtlogo.svg"
                alt="StatusMonitor"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="hidden sm:inline">StatusMonitor</span>
            </Link>

            <div className="hidden items-center gap-0.5 md:flex">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/history">History</NavLink>
            </div>
          </div>

          {/* Right: Theme + Auth + Hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary"
              aria-label={
                resolved === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {resolved === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="hidden md:block">
              {session?.user ? (
                <UserMenu user={session.user} />
              ) : (
                <SignInButton />
              )}
            </div>

            <button
              onClick={() => {
                setMobileOpen(!mobileOpen);
                onMenuToggle?.();
              }}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Status strip below pill */}
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-4 px-8 pt-2 pb-1 lg:px-10">
        <Activity className="h-3 w-3 text-text-muted opacity-50" />
        {/* Live indicator */}
        <div className="flex items-center gap-1.5" title={`Status: ${SSE_LABEL[status]}`}>
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${SSE_DOT[status]} ${
              status === "connected" ? "animate-pulse" : ""
            }`}
          />
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-wide text-text-muted">
            {SSE_LABEL[status]}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="h-3 w-3" />
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {lastEventAt
              ? `Updated ${formatTime(lastEventAt)}`
              : status === "connected"
                ? "Monitoring"
                : "Awaiting data"}
          </span>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mx-4 mt-1 rounded-2xl border border-border bg-surface px-4 pb-4 pt-2 backdrop-blur-[18px] md:hidden lg:mx-6">
          <nav className="flex flex-col gap-1">
            <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/history" onClick={() => setMobileOpen(false)}>
              History
            </MobileNavLink>
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3.5 py-1.5 text-[0.85rem] font-medium tracking-[0.4px] text-text-secondary transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-lg px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
    >
      {children}
    </Link>
  );
}
