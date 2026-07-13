"use client";

import { FormEvent, useEffect, useState } from "react";
import { PROVIDERS } from "@/lib/constants";

const SEVERITIES = ["critical", "major", "minor", "info"];

export function ManageSubscription({ id, token }: { id: string; token: string }) {
  const endpoint = `/api/subscriptions/manage?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  const [email, setEmail] = useState("");
  const [severities, setSeverities] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [status, setStatus] = useState("Loading preferences…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(endpoint).then(async (response) => {
      if (!response.ok) throw new Error("This manage link is invalid or no longer active.");
      return response.json();
    }).then((data) => {
      setEmail(data.email);
      setSeverities(data.severities);
      setSources(data.sources);
      setReady(true);
      setStatus("");
    }).catch((error) => setStatus(error.message));
  }, [endpoint]);

  function toggle(items: string[], value: string, setter: (next: string[]) => void) {
    setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving…");
    const response = await fetch(endpoint, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ severities, sources }) });
    setStatus(response.ok ? "Preferences saved." : "Unable to save preferences.");
  }

  async function unsubscribe() {
    if (!window.confirm(`Stop and delete all alert preferences for ${email}?`)) return;
    setStatus("Unsubscribing…");
    const response = await fetch(endpoint, { method: "DELETE" });
    if (response.ok) {
      setReady(false);
      setStatus("You have been unsubscribed and your subscription record was deleted.");
    } else setStatus("Unable to unsubscribe.");
  }

  if (!ready) return <div className="glass-card rounded-2xl p-7 text-sm text-text-secondary">{status}</div>;

  return (
    <form onSubmit={save} className="glass-card space-y-6 rounded-2xl p-5 sm:p-7">
      <div><p className="text-xs uppercase tracking-wider text-text-muted">Alert email</p><p className="mt-1 font-medium text-text-primary">{email}</p></div>
      <fieldset><legend className="mb-2 text-sm font-medium text-text-primary">Severity</legend><div className="flex flex-wrap gap-2">{SEVERITIES.map((severity) => <button type="button" key={severity} onClick={() => toggle(severities, severity, setSeverities)} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${severities.includes(severity) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary"}`}>{severity}</button>)}</div></fieldset>
      <fieldset><legend className="mb-1 text-sm font-medium text-text-primary">Providers</legend><p className="mb-3 text-xs text-text-muted">Choose none to receive alerts for every provider.</p><div className="max-h-64 overflow-y-auto rounded-xl border border-border p-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSources([])} className={`rounded-full border px-3 py-1.5 text-xs ${sources.length === 0 ? "border-secondary text-secondary" : "border-border text-text-secondary"}`}>All providers</button>{Object.entries(PROVIDERS).map(([key, provider]) => <button type="button" key={key} onClick={() => toggle(sources, key, setSources)} className={`rounded-full border px-3 py-1.5 text-xs ${sources.includes(key) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary"}`}>{provider.name}</button>)}</div></div></fieldset>
      {status && <p className="text-sm text-secondary" role="status">{status}</p>}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between"><button type="button" onClick={unsubscribe} className="rounded-lg border border-critical/40 px-4 py-2 text-sm text-critical">Unsubscribe</button><button disabled={severities.length === 0} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-background disabled:opacity-50">Save preferences</button></div>
    </form>
  );
}
