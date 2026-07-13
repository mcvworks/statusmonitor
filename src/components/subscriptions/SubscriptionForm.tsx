"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bell, Check, Mail } from "lucide-react";
import { PROVIDERS } from "@/lib/constants";

const ALERT_SEVERITIES = ["critical", "major", "minor", "info"] as const;
const DEFAULT_ALERT_SEVERITIES = ["critical", "major"];

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Informational",
};

export function SubscriptionForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [severities, setSeverities] = useState<string[]>(DEFAULT_ALERT_SEVERITIES);
  const [sources, setSources] = useState<string[]>([]);
  const [showProviders, setShowProviders] = useState(!compact);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const groups = useMemo(() => Object.entries(PROVIDERS).reduce<Record<string, Array<[string, (typeof PROVIDERS)[string]]>>>((result, entry) => {
    const category = entry[1].category;
    (result[category] ??= []).push(entry);
    return result;
  }, {}), []);

  function toggle(list: string[], value: string, setter: (values: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, severities, sources }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error ?? "Unable to subscribe right now.");
      setState("error");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4" role="status">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <div>
          <p className="font-semibold text-text-primary">Check your inbox</p>
          <p className="mt-1 text-sm text-text-secondary">Click the confirmation link we sent to {email}. Alerts begin only after you confirm.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor={compact ? "alert-email-compact" : "alert-email"} className="mb-2 block text-sm font-medium text-text-primary">
          Email address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id={compact ? "alert-email-compact" : "alert-email"}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-surface-input py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-primary"
            />
          </div>
          <button disabled={state === "sending" || severities.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            <Bell className="h-4 w-4" />
            {state === "sending" ? "Sending…" : "Get alerts"}
          </button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-primary">Alert severity</legend>
        <div className="flex flex-wrap gap-2">
          {ALERT_SEVERITIES.map((severity) => (
            <button key={severity} type="button" aria-pressed={severities.includes(severity)} onClick={() => toggle(severities, severity, setSeverities)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${severities.includes(severity) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary hover:border-text-muted"}`}>
              {SEVERITY_LABELS[severity]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text-primary">Providers</p>
          <button type="button" onClick={() => setShowProviders(!showProviders)} className="text-xs text-primary hover:underline">
            {showProviders ? "Hide providers" : "Choose providers"}
          </button>
        </div>
        <p className="mt-1 text-xs text-text-muted">{sources.length === 0 ? "All monitored providers" : `${sources.length} provider${sources.length === 1 ? "" : "s"} selected`}</p>
        {showProviders && (
          <div className="mt-3 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border bg-surface-input p-4">
            <button type="button" onClick={() => setSources([])} className={`rounded-full border px-3 py-1.5 text-xs transition ${sources.length === 0 ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-text-secondary"}`}>All providers</button>
            {Object.entries(groups).map(([category, providers]) => (
              <div key={category}>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-text-muted">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {providers.map(([key, provider]) => (
                    <button key={key} type="button" aria-pressed={sources.includes(key)} onClick={() => toggle(sources, key, setSources)} className={`rounded-full border px-3 py-1.5 text-xs transition ${sources.includes(key) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary hover:border-text-muted"}`}>
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-critical" role="alert">{error}</p>}
      <p className="text-xs text-text-muted">No password. Confirm by email, then manage or unsubscribe in one click from any alert.</p>
    </form>
  );
}
