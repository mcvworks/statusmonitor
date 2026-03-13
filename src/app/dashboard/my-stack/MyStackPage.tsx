"use client";

import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { MyStackEditor } from "@/components/dashboard/MyStackEditor";
import { PersonalBlastRadius } from "@/components/blast-radius/PersonalBlastRadius";

export function MyStackPage() {
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
            <Layers className="h-5 w-5 text-primary" />
            My Stack
          </h1>
          <p className="text-xs text-text-muted">
            Define your infrastructure to get personalized blast radius analysis
          </p>
        </div>
      </div>

      {/* Personal Blast Radius */}
      <PersonalBlastRadius />

      {/* Stack Editor */}
      <MyStackEditor />
    </div>
  );
}
