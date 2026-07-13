"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import { Check, ExternalLink, MessageSquare, Trash2, Users } from "lucide-react";
import { BROWSER_STORAGE_KEYS, readBrowserData, writeBrowserData } from "@/lib/browser-storage";

interface SavedConnection { id: string; token: string; channel: "slack" | "teams"; createdAt: string }
const SEVERITIES = ["critical", "major", "minor", "info"];

export function SlackConnection() {
  const { data: connections = [], mutate } = useSWR<SavedConnection[]>(
    BROWSER_STORAGE_KEYS.channels,
    () => readBrowserData(BROWSER_STORAGE_KEYS.channels, []),
  );
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState<"slack" | "teams">("slack");
  const [severities, setSeverities] = useState(["critical", "major"]);
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function connect(event: FormEvent) {
    event.preventDefault();
    setConnecting(true);
    setStatus("Sending a test message…");
    const response = await fetch("/api/channel-subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel, webhookUrl, severities, sources: [] }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error ?? "Unable to connect Slack.");
      setConnecting(false);
      return;
    }
    const next = [...connections, { id: body.id, token: body.token, channel, createdAt: new Date().toISOString() }];
    writeBrowserData(BROWSER_STORAGE_KEYS.channels, next);
    await mutate(next, { revalidate: false });
    setWebhookUrl("");
    setStatus(`${channel === "slack" ? "Slack" : "Teams"} connected. The channel received a test message.`);
    setConnecting(false);
  }

  async function disconnect(connection: SavedConnection) {
    if (!window.confirm("Stop sending DTMonitor alerts to this Slack channel?")) return;
    const response = await fetch(`/api/channel-subscriptions?id=${encodeURIComponent(connection.id)}&token=${encodeURIComponent(connection.token)}`, { method: "DELETE" });
    if (!response.ok) { setStatus("Unable to disconnect this channel."); return; }
    const next = connections.filter((item) => item.id !== connection.id);
    writeBrowserData(BROWSER_STORAGE_KEYS.channels, next);
    await mutate(next, { revalidate: false });
    setStatus("Slack channel disconnected.");
  }

  function toggle(severity: string) {
    setSeverities((current) => current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity]);
  }

  return (
    <div className="glass-card space-y-5 p-5">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><MessageSquare className="h-4 w-4 text-secondary" />Slack &amp; Teams alerts</h2><p className="mt-1 text-xs leading-5 text-text-muted">Connect an incoming webhook. The workspace authorizes the channel; no DTMonitor account is created. Webhook URLs are encrypted on the server.</p></div>
      {connections.map((connection, index) => (
        <div key={connection.id} className="flex items-center justify-between rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3"><span className="flex items-center gap-2 text-xs text-secondary"><Check className="h-4 w-4" />{connection.channel === "slack" ? "Slack" : "Teams"} channel {index + 1} connected</span><button onClick={() => disconnect(connection)} className="rounded-lg p-2 text-text-muted hover:bg-critical/10 hover:text-critical" title="Disconnect"><Trash2 className="h-3.5 w-3.5" /></button></div>
      ))}
      <form onSubmit={connect} className="space-y-4">
        <div className="flex gap-2"><button type="button" onClick={() => setChannel("slack")} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${channel === "slack" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"}`}><MessageSquare className="h-3.5 w-3.5" />Slack</button><button type="button" onClick={() => setChannel("teams")} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${channel === "teams" ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"}`}><Users className="h-3.5 w-3.5" />Teams</button></div>
        <div><label htmlFor="channel-webhook" className="mb-1.5 block text-xs font-medium text-text-secondary">Incoming webhook URL</label><input id="channel-webhook" type="password" required value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder={channel === "slack" ? "https://hooks.slack.com/services/…" : "https://…webhook.office.com/…"} className="w-full rounded-lg border border-border bg-surface-input px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary" /><a href={channel === "slack" ? "https://api.slack.com/messaging/webhooks" : "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Create a webhook in {channel === "slack" ? "Slack" : "Teams"} <ExternalLink className="h-3 w-3" /></a></div>
        <div><p className="mb-2 text-xs font-medium text-text-secondary">Severity</p><div className="flex flex-wrap gap-2">{SEVERITIES.map((severity) => <button key={severity} type="button" onClick={() => toggle(severity)} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${severities.includes(severity) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"}`}>{severity}</button>)}</div></div>
        <button disabled={connecting || severities.length === 0} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">{connecting ? "Connecting…" : `Connect ${channel === "slack" ? "Slack" : "Teams"} channel`}</button>
      </form>
      {status && <p className="text-xs text-secondary" role="status">{status}</p>}
    </div>
  );
}
