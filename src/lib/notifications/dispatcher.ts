import { prisma } from "@/lib/db";
import type { Alert } from "@/generated/prisma/client";
import { sendEmailNotification } from "./email";
import { sendSlackNotification } from "./slack";
import { sendTeamsNotification } from "./teams";
import { sendPushNotification } from "./web-push";

interface NotificationChannel {
  channel: string;
  send: (
    userId: string,
    email: string,
    alerts: Alert[],
    config: Record<string, unknown>,
  ) => Promise<void>;
}

const channels: NotificationChannel[] = [
  { channel: "email", send: sendEmailNotification },
  { channel: "slack", send: sendSlackNotification },
  { channel: "teams", send: sendTeamsNotification },
  { channel: "push", send: sendPushNotification },
];

/**
 * Register an additional notification channel (for Slack/Teams/Push later).
 */
export function registerChannel(ch: NotificationChannel) {
  channels.push(ch);
}

/**
 * Dispatch notifications for a batch of new/updated alerts.
 * Called by the polling engine after each poll cycle.
 */
export async function dispatchNotifications(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;

  // Find all users with enabled notification prefs
  const prefs = await prisma.userNotificationPref.findMany({
    where: { enabled: true },
    include: { user: { select: { id: true, email: true } } },
  });

  if (prefs.length === 0) return;

  // Group prefs by user+channel
  for (const pref of prefs) {
    if (!pref.user.email) continue;

    const severityFilter = parseSeverityFilter(pref.severityFilter);
    const sourceFilter = parseSourceFilter(pref.sourceFilter);

    // Filter alerts to match this user's preference
    const matching = alerts.filter((alert) => {
      if (severityFilter.length > 0 && !severityFilter.includes(alert.severity)) {
        return false;
      }
      if (sourceFilter.length > 0 && !sourceFilter.includes(alert.source)) {
        return false;
      }
      return true;
    });

    if (matching.length === 0) continue;

    // Find the channel handler
    const handler = channels.find((ch) => ch.channel === pref.channel);
    if (!handler) continue;

    const config = safeParseJSON(pref.config);

    try {
      await handler.send(pref.user.id, pref.user.email, matching, config);

      // Log success for each alert
      await logNotifications(pref.user.id, pref.channel, matching, true);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      // Log failure
      await logNotifications(pref.user.id, pref.channel, matching, false, error);
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function parseSeverityFilter(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseSourceFilter(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseJSON(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

async function logNotifications(
  userId: string,
  channel: string,
  alerts: Alert[],
  success: boolean,
  error?: string,
) {
  await Promise.allSettled(
    alerts.map((alert) =>
      prisma.notificationLog.create({
        data: {
          userId,
          channel,
          alertId: alert.id,
          success,
          error,
        },
      }),
    ),
  );
}
