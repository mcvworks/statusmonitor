import { prisma } from "@/lib/db";
import type { Alert } from "@/generated/prisma/client";
import { sendEmailNotification } from "./email";
import { sendSubscriberAlertEmail } from "./email";
import { appUrl, createManageToken } from "@/lib/email-subscriptions";
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

  const uniqueAlerts = [...new Map(alerts.map((alert) => [alert.id, alert])).values()];

  await Promise.all([
    dispatchUserNotifications(uniqueAlerts),
    dispatchPublicEmailSubscriptions(uniqueAlerts),
  ]);
}

/** Retry transient public-email failures for recent alert events. */
export async function retryFailedPublicNotifications(): Promise<void> {
  const failures = await prisma.emailSubscriptionLog.findMany({
    where: {
      success: false,
      sentAt: { lt: new Date(Date.now() - 5 * 60_000) },
      alert: { updatedAt: { gt: new Date(Date.now() - 24 * 60 * 60_000) } },
      subscription: { enabled: true, verifiedAt: { not: null } },
    },
    include: { alert: true, subscription: true },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  const groups = Map.groupBy(failures, (failure) => failure.subscriptionId);
  for (const group of groups.values()) {
    const subscription = group[0]?.subscription;
    if (!subscription) continue;
    const events = group.map((failure) => ({ alert: failure.alert, eventKey: failure.eventKey }));
    const token = createManageToken(subscription.id);
    const manageUrl = appUrl(`/subscribe/manage?id=${encodeURIComponent(subscription.id)}&token=${encodeURIComponent(token)}`);
    try {
      await sendSubscriberAlertEmail(subscription.email, events.map(({ alert }) => alert), manageUrl);
      await logPublicNotifications(subscription.id, events, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logPublicNotifications(subscription.id, events, false, message);
    }
  }
}

async function dispatchUserNotifications(alerts: Alert[]): Promise<void> {

  // Find all users with enabled notification prefs
  const prefs = await prisma.userNotificationPref.findMany({
    where: { enabled: true },
    include: { user: { select: { id: true, email: true } } },
  });

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

async function dispatchPublicEmailSubscriptions(alerts: Alert[]): Promise<void> {
  const subscriptions = await prisma.emailSubscription.findMany({
    where: { enabled: true, verifiedAt: { not: null } },
  });

  for (const subscription of subscriptions) {
    const severityFilter = parseSeverityFilter(subscription.severityFilter);
    const sourceFilter = parseSourceFilter(subscription.sourceFilter);
    const filtered = alerts.filter((alert) =>
      (severityFilter.length === 0 || severityFilter.includes(alert.severity))
      && (sourceFilter.length === 0 || sourceFilter.includes(alert.source)),
    );
    if (filtered.length === 0) continue;

    const eventKeys = filtered.map((alert) => ({
      alert,
      eventKey: `${alert.status}:${alert.severity}`,
    }));
    const delivered = await prisma.emailSubscriptionLog.findMany({
      where: {
        subscriptionId: subscription.id,
        success: true,
        OR: eventKeys.map(({ alert, eventKey }) => ({ alertId: alert.id, eventKey })),
      },
      select: { alertId: true, eventKey: true },
    });
    const deliveredKeys = new Set(delivered.map((log) => `${log.alertId}:${log.eventKey}`));
    const pending = eventKeys.filter(({ alert, eventKey }) =>
      !deliveredKeys.has(`${alert.id}:${eventKey}`),
    );
    if (pending.length === 0) continue;

    const token = createManageToken(subscription.id);
    const manageUrl = appUrl(`/subscribe/manage?id=${encodeURIComponent(subscription.id)}&token=${encodeURIComponent(token)}`);

    try {
      await sendSubscriberAlertEmail(
        subscription.email,
        pending.map(({ alert }) => alert),
        manageUrl,
      );
      await logPublicNotifications(subscription.id, pending, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await logPublicNotifications(subscription.id, pending, false, message);
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

async function logPublicNotifications(
  subscriptionId: string,
  events: Array<{ alert: Alert; eventKey: string }>,
  success: boolean,
  error?: string,
) {
  await Promise.allSettled(events.map(({ alert, eventKey }) =>
    prisma.emailSubscriptionLog.upsert({
      where: {
        subscriptionId_alertId_eventKey: { subscriptionId, alertId: alert.id, eventKey },
      },
      create: { subscriptionId, alertId: alert.id, eventKey, success, error },
      update: { success, error, sentAt: new Date() },
    }),
  ));
}
