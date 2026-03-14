"use client";

import { useState, useCallback } from "react";
import {
  Mail,
  MessageSquare,
  Users,
  Bell,
  Send,
  Loader2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { useNotificationPrefs, type NotificationPref } from "@/hooks/useNotificationPrefs";
import { PROVIDERS } from "@/lib/constants";

const SEVERITIES = ["critical", "major", "minor", "info"] as const;

const SEVERITY_COLORS: Record<string, { fg: string; bg: string }> = {
  critical: { fg: "#ff6b6b", bg: "rgba(255, 107, 107, 0.06)" },
  major: { fg: "#FA6216", bg: "rgba(250, 98, 22, 0.06)" },
  minor: { fg: "#F2C200", bg: "rgba(242, 194, 0, 0.08)" },
  info: { fg: "#48E0C7", bg: "rgba(72, 224, 199, 0.06)" },
};

const CHANNEL_META: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  email: {
    label: "Email",
    icon: <Mail className="h-4 w-4" />,
    description: "Receive alert digests via email (uses your account email)",
  },
  slack: {
    label: "Slack",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Send alerts to a Slack channel via webhook",
  },
  teams: {
    label: "Microsoft Teams",
    icon: <Users className="h-4 w-4" />,
    description: "Send alerts to a Teams channel via webhook",
  },
  push: {
    label: "Browser Push",
    icon: <Bell className="h-4 w-4" />,
    description: "Receive push notifications in your browser",
  },
};

const AVAILABLE_CHANNELS = ["email", "slack", "teams"];

const WEBHOOK_PATTERNS: Record<string, { pattern: RegExp; hint: string; helpUrl: string; helpLabel: string }> = {
  slack: {
    pattern: /^https:\/\/hooks\.slack\.com\//,
    hint: "Must start with https://hooks.slack.com/",
    helpUrl: "https://api.slack.com/messaging/webhooks",
    helpLabel: "How to create a Slack incoming webhook",
  },
  teams: {
    pattern: /^https:\/\/.+\.webhook\.office\.com\//,
    hint: "Must be a valid Teams webhook URL (*.webhook.office.com)",
    helpUrl: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
    helpLabel: "How to create a Teams incoming webhook",
  },
};

export function NotificationForm() {
  const { prefs, isLoading, save, sendTest } = useNotificationPrefs();
  const [localPrefs, setLocalPrefs] = useState<Record<string, NotificationPref>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean; message?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Merge server prefs with local edits
  const getPref = useCallback(
    (channel: string): NotificationPref => {
      if (localPrefs[channel]) return localPrefs[channel];
      const existing = prefs.find((p) => p.channel === channel);
      return (
        existing ?? {
          channel,
          enabled: false,
          config: {},
          severityFilter: [],
          sourceFilter: [],
        }
      );
    },
    [prefs, localPrefs],
  );

  const updatePref = (channel: string, updates: Partial<NotificationPref>) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [channel]: { ...getPref(channel), ...updates },
    }));
    setSaveSuccess(false);
  };

  const toggleSeverity = (channel: string, severity: string) => {
    const pref = getPref(channel);
    const current = pref.severityFilter as string[];
    const next = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity];
    updatePref(channel, { severityFilter: next });
  };

  const toggleSource = (channel: string, source: string) => {
    const pref = getPref(channel);
    const current = pref.sourceFilter as string[];
    const next = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    updatePref(channel, { sourceFilter: next });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allPrefs = AVAILABLE_CHANNELS.map((ch) => getPref(ch));
      await save(allPrefs);
      setLocalPrefs({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel: string) => {
    setTesting(channel);
    setTestResult(null);
    try {
      await sendTest(channel);
      setTestResult({ channel, success: true });
    } catch (err) {
      setTestResult({
        channel,
        success: false,
        message: err instanceof Error ? err.message : "Failed to send test",
      });
    } finally {
      setTesting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {AVAILABLE_CHANNELS.map((channel) => {
        const meta = CHANNEL_META[channel];
        const pref = getPref(channel);

        return (
          <div
            key={channel}
            className="glass-card rounded-xl border border-border p-5"
          >
            {/* Channel header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-primary">{meta.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {meta.label}
                  </h3>
                  <p className="text-xs text-text-muted">{meta.description}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  onChange={(e) =>
                    updatePref(channel, { enabled: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-surface-hover transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-text-muted after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:bg-bg-primary" />
              </label>
            </div>

            {pref.enabled && (
              <div className="space-y-4 border-t border-border pt-4">
                {/* Webhook URL config (Slack / Teams) */}
                {WEBHOOK_PATTERNS[channel] && (() => {
                  const wp = WEBHOOK_PATTERNS[channel];
                  const webhookUrl = (pref.config as Record<string, unknown>).webhookUrl as string ?? "";
                  const isInvalid = webhookUrl.length > 0 && !wp.pattern.test(webhookUrl);
                  return (
                    <div>
                      <label className="section-label mb-2">Webhook URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) =>
                          updatePref(channel, {
                            config: { ...pref.config as Record<string, unknown>, webhookUrl: e.target.value },
                          })
                        }
                        placeholder={wp.hint}
                        className={`w-full rounded-lg border bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 ${
                          isInvalid
                            ? "border-error focus:ring-error/20"
                            : "border-border focus:ring-primary/20"
                        }`}
                      />
                      {isInvalid && (
                        <p className="mt-1 text-xs text-error">{wp.hint}</p>
                      )}
                      <a
                        href={wp.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {wp.helpLabel}
                      </a>
                    </div>
                  );
                })()}

                {/* Severity filter */}
                <div>
                  <label className="section-label mb-2">
                    Severity threshold
                  </label>
                  <p className="mb-2 text-xs text-text-muted">
                    Select which severity levels trigger notifications. Leave empty for all.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SEVERITIES.map((sev) => {
                      const active = (pref.severityFilter as string[]).includes(sev);
                      const colors = SEVERITY_COLORS[sev];
                      return (
                        <button
                          key={sev}
                          onClick={() => toggleSeverity(channel, sev)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                          style={{
                            background: active ? colors.bg : "transparent",
                            color: active ? colors.fg : "#8892A0",
                            border: `1.5px solid ${active ? colors.fg + "40" : "#232A35"}`,
                          }}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Source filter */}
                <div>
                  <label className="section-label mb-2">
                    Source filter
                  </label>
                  <p className="mb-2 text-xs text-text-muted">
                    Select which providers to receive notifications for. Leave empty for all.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(PROVIDERS).map(([id, meta]) => {
                      const active = (pref.sourceFilter as string[]).includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleSource(channel, id)}
                          className={`rounded-md px-2 py-1 text-[11px] transition-all ${
                            active
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-transparent text-text-muted hover:text-text-secondary"
                          } border`}
                        >
                          {meta.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Test button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTest(channel)}
                    disabled={testing === channel}
                    className="btn-ghost flex items-center gap-2 text-xs"
                  >
                    {testing === channel ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send test notification
                  </button>

                  {testResult?.channel === channel && (
                    <span
                      className={`flex items-center gap-1 text-xs ${
                        testResult.success ? "text-success" : "text-error"
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      {testResult.success
                        ? "Test sent!"
                        : testResult.message ?? "Failed"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Upcoming channels (disabled, shown for awareness) */}
      {["push"]
        .filter((ch) => !AVAILABLE_CHANNELS.includes(ch))
        .map((channel) => {
          const meta = CHANNEL_META[channel];
          return (
            <div
              key={channel}
              className="glass-card rounded-xl border border-border p-5 opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-text-muted">{meta.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary">
                    {meta.label}
                    <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-normal text-text-muted">
                      Coming soon
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted">{meta.description}</p>
                </div>
              </div>
            </div>
          );
        })}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saveSuccess ? "Saved!" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
