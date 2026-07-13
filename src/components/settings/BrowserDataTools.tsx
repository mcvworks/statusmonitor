"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { BROWSER_STORAGE_KEYS, exportBrowserData, writeBrowserData } from "@/lib/browser-storage";

interface ImportData {
  version: number;
  dashboards: unknown[];
  stack: unknown[];
  alertStates: Record<string, unknown>;
  channels?: unknown[];
}

export function BrowserDataTools() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function download() {
    const data = JSON.stringify(exportBrowserData(), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dtmonitor-settings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Settings exported.");
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as ImportData;
      if (data.version !== 1 || !Array.isArray(data.dashboards) || !Array.isArray(data.stack) || !data.alertStates || Array.isArray(data.alertStates)) {
        throw new Error("Invalid DTMonitor settings file");
      }
      writeBrowserData(BROWSER_STORAGE_KEYS.dashboards, data.dashboards);
      writeBrowserData(BROWSER_STORAGE_KEYS.stack, data.stack);
      writeBrowserData(BROWSER_STORAGE_KEYS.alertStates, data.alertStates);
      writeBrowserData(BROWSER_STORAGE_KEYS.channels, Array.isArray(data.channels) ? data.channels : []);
      setMessage("Settings imported. Reloading…");
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      setMessage("That file is not a valid DTMonitor settings export.");
    } finally {
      event.target.value = "";
    }
  }

  function reset() {
    if (!window.confirm("Delete saved views, stack entries, and alert actions from this browser?")) return;
    Object.values(BROWSER_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
    setMessage("Local settings cleared. Reloading…");
    window.setTimeout(() => window.location.reload(), 500);
  }

  return (
    <div className="glass-card space-y-4 p-5">
      <div><h2 className="text-sm font-semibold text-text-primary">Browser data</h2><p className="mt-1 text-xs leading-5 text-text-muted">Your dashboard, stack, and alert actions stay on this device. Export a backup to move them to another browser.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"><Download className="h-3.5 w-3.5" />Export settings</button>
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"><Upload className="h-3.5 w-3.5" />Import settings</button>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-critical/30 px-3 py-2 text-xs text-critical hover:bg-critical/5"><Trash2 className="h-3.5 w-3.5" />Clear local data</button>
        <input ref={inputRef} type="file" accept="application/json" onChange={importFile} className="hidden" />
      </div>
      {message && <p className="text-xs text-secondary" role="status">{message}</p>}
    </div>
  );
}
