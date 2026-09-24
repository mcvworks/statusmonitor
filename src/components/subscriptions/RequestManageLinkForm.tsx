"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function RequestManageLinkForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to request a link. Please try again.");
      setState("sent");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request a link. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") return (
    <div className="glass-card space-y-3 rounded-2xl p-5 sm:p-7" role="status">
      <h2 className="font-semibold text-text-primary">Check your inbox</h2>
      <p className="text-sm text-text-secondary">If {email} has an email subscription, we sent a private link to manage or stop its alerts. Check your spam folder too.</p>
      <p className="text-sm text-text-muted">Requesting a link does not start, stop, or change any alerts.</p>
      <button type="button" onClick={() => setState("idle")} className="text-sm text-primary-ink underline">Use a different email address</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="glass-card space-y-4 rounded-2xl p-5 sm:p-7">
      <p className="text-sm leading-6 text-text-secondary">Enter the address you subscribed with. We’ll email a private link so only someone with access to that inbox can change or stop its alerts.</p>
      <div>
        <label htmlFor="manage-alert-email" className="mb-2 block text-sm font-medium text-text-primary">Email address</label>
        <input id="manage-alert-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={state === "sending"} className="w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary" />
      </div>
      <button disabled={state === "sending"} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">{state === "sending" ? "Sending…" : "Email me a management link"}</button>
      {error && <p role="alert" className="text-sm text-critical-ink">{error}</p>}
      <p className="text-xs leading-5 text-text-muted">No account or password needed. This form does not subscribe you. You can also use the Unsubscribe link in any alert email.</p>
      <p className="text-xs text-text-muted">Looking for browser, Slack, or Teams alerts? <Link href="/dashboard/settings" className="text-primary-ink underline">Open alert settings</Link>.</p>
    </form>
  );
}
