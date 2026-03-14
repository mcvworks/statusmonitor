import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--sidebar-bg)]">
      <div className="flex flex-col items-center justify-between gap-3 px-4 py-4 text-text-muted sm:flex-row lg:px-6">
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px]">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span>
            Built by{" "}
            <a
              href="https://ducktyped.com"
              className="font-medium text-text-secondary transition-colors hover:text-primary"
            >
              Ducktyped
            </a>
          </span>
        </div>

        <div className="font-[family-name:var(--font-mono)] text-[11px]">
          Data sourced from official status pages & feeds
        </div>
      </div>
    </footer>
  );
}
