export const BROWSER_STORAGE_KEYS = {
  dashboards: "dtmonitor:dashboards:v1",
  stack: "dtmonitor:stack:v1",
  alertStates: "dtmonitor:alert-states:v1",
  channels: "dtmonitor:channels:v1",
} as const;

export function readBrowserData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeBrowserData<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function localId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}_${uuid}` : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function exportBrowserData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    dashboards: readBrowserData(BROWSER_STORAGE_KEYS.dashboards, []),
    stack: readBrowserData(BROWSER_STORAGE_KEYS.stack, []),
    alertStates: readBrowserData(BROWSER_STORAGE_KEYS.alertStates, {}),
    channels: readBrowserData(BROWSER_STORAGE_KEYS.channels, []),
  };
}
