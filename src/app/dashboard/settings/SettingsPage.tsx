"use client";

import Link from "next/link";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { BrowserDataTools } from "@/components/settings/BrowserDataTools";
import { SlackConnection } from "@/components/settings/SlackConnection";
import { BrowserPushControl } from "@/components/settings/BrowserPushControl";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary"><ArrowLeft className="h-4 w-4" /></Link>
        <div><h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary"><Settings className="h-5 w-5 text-primary" />Settings</h1><p className="text-xs text-text-muted">Manage private browser data and account-free alerts</p></div>
      </div>
      <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Bell className="h-4 w-4 text-primary" />Email alerts</h2><p className="mt-1 text-xs text-text-muted">Email subscriptions use a confirmation link—no DTMonitor account or password.</p></div>
        <Link href="/subscribe" className="shrink-0 rounded-lg bg-primary px-4 py-2 text-center text-xs font-semibold text-background">Manage email alerts</Link>
      </div>
      <SlackConnection />
      <BrowserPushControl />
      <BrowserDataTools />
    </div>
  );
}
