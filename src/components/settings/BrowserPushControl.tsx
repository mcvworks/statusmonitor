"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function BrowserPushControl() {
  const push = usePushNotifications();
  const [error, setError] = useState("");

  async function enable() {
    setError("");
    try { await push.subscribe(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to enable push notifications."); }
  }

  async function stop() {
    setError("");
    try { await push.unsubscribe(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to stop browser alerts. Please try again."); }
  }

  return (
    <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Bell className="h-4 w-4 text-primary" />Browser alerts</h2><p className="mt-1 text-xs leading-5 text-text-muted">Send critical and major alerts to this browser. Stopping them here affects this browser only; email, Slack, Teams, and other browsers are managed separately.</p></div>
      {!push.isSupported ? (
        <span className="text-xs text-text-muted">Not supported by this browser</span>
      ) : push.isSubscribed ? (
        <button onClick={stop} disabled={push.isLoading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-critical/30 px-4 py-2 text-xs text-critical"><BellOff className="h-3.5 w-3.5" />{push.isLoading ? "Stopping…" : "Stop browser alerts"}</button>
      ) : (
        <button onClick={enable} disabled={push.isLoading || push.permission === "denied"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">{push.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}{push.permission === "denied" ? "Blocked in browser" : "Enable browser alerts"}</button>
      )}
      {error && <p className="text-xs text-critical" role="alert">{error}</p>}
    </div>
  );
}
