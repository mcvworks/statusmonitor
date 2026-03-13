"use client";

import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { NotificationForm } from "@/components/settings/NotificationForm";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
            <Settings className="h-5 w-5 text-primary" />
            Notification Settings
          </h1>
          <p className="text-xs text-text-muted">
            Configure how and when you receive alert notifications
          </p>
        </div>
      </div>

      {/* Notification form */}
      <NotificationForm />
    </div>
  );
}
