import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-card corner-brackets mx-auto max-w-md p-8">
        <Activity className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl font-bold text-primary">
          404
        </h1>
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
          Page not found
        </h2>
        <p className="mb-6 text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-[#0F1114] transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
