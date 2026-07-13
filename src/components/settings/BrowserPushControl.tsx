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

  return (
    <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Bell className="h-4 w-4 text-primary" />Browser push</h2><p className="mt-1 text-xs leading-5 text-text-muted">Critical and major alerts can be sent directly to this browser. The browser permission is the authorization—no account required.</p></div>
      {!push.isSupported ? (
        <span className="text-xs text-text-muted">Not supported by this browser</span>
      ) : push.isSubscribed ? (
        <button onClick={() => push.unsubscribe()} disabled={push.isLoading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-critical/30 px-4 py-2 text-xs text-critical"><BellOff className="h-3.5 w-3.5" />Disable push</button>
      ) : (
        <button onClick={enable} disabled={push.isLoading || push.permission === "denied"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">{push.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}{push.permission === "denied" ? "Blocked in browser" : "Enable push"}</button>
      )}
      {error && <p className="text-xs text-critical" role="alert">{error}</p>}
    </div>
  );
}
