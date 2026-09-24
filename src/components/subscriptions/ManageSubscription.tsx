"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PROVIDERS } from "@/lib/constants";

const SEVERITIES = ["critical", "major", "minor", "info"];

export function ManageSubscription({ id, token }: { id: string; token: string }) {
  const endpoint = `/api/subscriptions/manage?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  const [email, setEmail] = useState("");
  const [severities, setSeverities] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"loading" | "ready" | "unsubscribed" | "error">("loading");
  const [busy, setBusy] = useState<"save" | "unsubscribe" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("This link is invalid or its email subscription has already been removed.");
      return response.json();
    }).then((data) => {
      setEmail(data.email);
      setSeverities(data.severities);
      setSources(data.sources);
      setConfirmed(data.confirmed);
      setPhase("ready");
    }).catch((cause) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Unable to load your preferences.");
      setPhase("error");
    });
    return () => controller.abort();
  }, [endpoint]);

  function toggle(items: string[], value: string, setter: (next: string[]) => void) {
    setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy("save"); setStatus(""); setError("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ severities, sources }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to save preferences. Please try again.");
      setStatus("Preferences saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save preferences. Please try again.");
    } finally { setBusy(null); }
  }

  async function unsubscribe() {
    setBusy("unsubscribe"); setStatus(""); setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to stop email alerts. Please try again.");
      setPhase("unsubscribed");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to stop email alerts. Please try again.");
    } finally { setBusy(null); }
  }

  if (phase === "loading") return <p className="glass-card rounded-2xl p-7 text-sm text-text-secondary" role="status">Loading preferences…</p>;
  if (phase === "error") return <div className="glass-card space-y-3 rounded-2xl p-7"><p className="text-sm text-critical" role="alert">{error}</p><Link href="/subscribe/manage" className="text-sm text-primary underline">Request a new management link</Link></div>;
  if (phase === "unsubscribed") return (
    <div className="glass-card space-y-3 rounded-2xl p-5 sm:p-7" role="status">
      <h2 className="text-lg font-semibold text-text-primary">Email alerts are stopped</h2>
      <p className="break-words text-sm text-text-secondary">The email subscription for {email} and its saved alert preferences were deleted. An email already being sent may still arrive.</p>
      <p className="text-sm text-text-muted">Browser, Slack, and Teams alerts are managed separately in <Link href="/dashboard/settings" className="text-primary underline">alert settings</Link>.</p>
      <Link href="/" className="inline-block text-sm text-primary underline">View live status</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <section id="unsubscribe" className="glass-card space-y-3 rounded-2xl border border-critical/30 p-5 sm:p-7" aria-labelledby="stop-email-heading">
        <h2 id="stop-email-heading" className="text-lg font-semibold text-text-primary">Stop email alerts</h2>
        <p className="break-words text-sm text-text-secondary">Unsubscribe {email} and remove its saved email-alert preferences.</p>
        <button type="button" onClick={unsubscribe} disabled={busy !== null} className="rounded-lg border border-critical/60 px-4 py-2.5 text-sm font-semibold text-critical hover:bg-critical/10 disabled:opacity-50">{busy === "unsubscribe" ? "Stopping email alerts…" : "Unsubscribe from email alerts"}</button>
        <p className="text-xs leading-5 text-text-muted">This stops email alerts only. Manage browser, Slack, and Teams alerts in <Link href="/dashboard/settings" className="text-primary underline">alert settings</Link>.</p>
      </section>
      {error && <p className="text-sm text-critical" role="alert">{error}</p>}
      {!confirmed ? <p className="glass-card rounded-2xl p-5 text-sm text-text-secondary">This email subscription has not been confirmed, so alerts have not started. Use your confirmation email to start alerts, or unsubscribe above to remove the pending subscription.</p> : (
        <form onSubmit={save} className="glass-card space-y-5 rounded-2xl p-5 sm:p-7">
          <h2 className="font-semibold text-text-primary">Change email preferences</h2>
          <fieldset disabled={busy !== null}><legend className="mb-2 text-sm font-medium text-text-primary">Severity</legend><div className="flex flex-wrap gap-2">{SEVERITIES.map((severity) => <button type="button" aria-pressed={severities.includes(severity)} key={severity} onClick={() => toggle(severities, severity, setSeverities)} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${severities.includes(severity) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary"}`}>{severity}</button>)}</div></fieldset>
          <fieldset disabled={busy !== null}><legend className="mb-1 text-sm font-medium text-text-primary">Providers</legend><p className="mb-3 text-xs text-text-muted">Selecting no individual providers means all providers. To stop emails, use Unsubscribe above.</p><div className="max-h-64 overflow-y-auto rounded-xl border border-border p-3"><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={sources.length === 0} onClick={() => setSources([])} className={`rounded-full border px-3 py-1.5 text-xs ${sources.length === 0 ? "border-secondary text-secondary" : "border-border text-text-secondary"}`}>All providers</button>{Object.entries(PROVIDERS).map(([key, provider]) => <button type="button" aria-pressed={sources.includes(key)} key={key} onClick={() => toggle(sources, key, setSources)} className={`rounded-full border px-3 py-1.5 text-xs ${sources.includes(key) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary"}`}>{provider.name}</button>)}</div></div></fieldset>
          {status && <p className="text-sm text-secondary" role="status">{status}</p>}
          <button disabled={busy !== null || severities.length === 0} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50">{busy === "save" ? "Saving…" : "Save preferences"}</button>
        </form>
      )}
    </div>
  );
}
