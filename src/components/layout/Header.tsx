"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  Clock,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { SignInButton } from "@/components/auth/SignInButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useDarkMode } from "@/hooks/useDarkMode";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolved, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--header-bg)] backdrop-blur-[18px]">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-bold tracking-wide text-primary"
          >
            <Activity className="h-5 w-5" />
            StatusMonitor
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/history">History</NavLink>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="status-dot status-dot-operational animate-pulse" />
            <span className="font-[family-name:var(--font-mono)] text-[11px] text-text-muted">
              LIVE
            </span>
          </div>

          {/* Last updated */}
          <div className="hidden items-center gap-1.5 text-text-muted lg:flex">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-[family-name:var(--font-mono)] text-[11px]">
              Updated just now
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolved === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Auth */}
          <div className="hidden md:block">
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <SignInButton />
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => {
              setMobileOpen(!mobileOpen);
              onMenuToggle?.();
            }}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 pb-4 pt-2 md:hidden">
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
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
