"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-card corner-brackets mx-auto max-w-md p-8">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-text-primary">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-[#0F1114] transition-colors hover:bg-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
