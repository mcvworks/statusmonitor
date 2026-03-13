"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user.name ?? user.email ?? "User";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[#232A35] bg-[#10141A] px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[#E9EEF5] transition-all hover:border-[#2a3140] hover:bg-[#1A2030]"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2C200] font-[family-name:var(--font-display)] text-[10px] font-bold text-[#0F1114]">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">
          {displayName}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#8892A0] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[#232A35] bg-[#151A22] p-1.5 shadow-xl backdrop-blur-[18px]">
          {/* User info */}
          <div className="border-b border-[#232A35] px-3 py-2.5">
            <p className="truncate font-[family-name:var(--font-body)] text-sm font-medium text-[#E9EEF5]">
              {user.name ?? "User"}
            </p>
            {user.email && (
              <p className="truncate font-[family-name:var(--font-body)] text-xs text-[#8892A0]">
                {user.email}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="py-1.5">
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            <MenuLink href="/dashboard/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Settings
            </MenuLink>
          </div>

          {/* Sign out */}
          <div className="border-t border-[#232A35] pt-1.5">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[#ff6b6b] transition-colors hover:bg-[rgba(255,107,107,0.06)]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-[family-name:var(--font-body)] text-sm text-[#B8C0CC] transition-colors hover:bg-[#1A2030] hover:text-[#E9EEF5]"
    >
      {icon}
      {children}
    </Link>
  );
}
