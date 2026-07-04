import { Activity, Rss } from "lucide-react";
import { FeedbackButton } from "./FeedbackButton";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--sidebar-bg)]">
      <div className="flex flex-col items-center justify-between gap-3 px-4 py-4 text-text-muted sm:flex-row lg:px-6">
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px]">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span>
            Built by{" "}
            <a
              href="https://ducktyped.xyz"
              className="font-medium text-text-secondary transition-colors hover:text-primary"
            >
              duckTyped
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[11px]">
          <span>Data sourced from official status pages & feeds</span>
          <a
            href="/feed.xml"
            className="inline-flex items-center gap-1 text-text-secondary transition-colors hover:text-primary"
            title="Subscribe to alerts (RSS)"
          >
            <Rss className="h-3 w-3" />
            RSS
          </a>
          <FeedbackButton />
        </div>
      </div>
    </footer>
  );
}
