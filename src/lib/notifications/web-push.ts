import webpush from "web-push";
import type { Alert } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

// ─── VAPID Setup ──────────────────────────────────────────────

function getVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@monitor.ducktyped.com";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
  }

  return { publicKey, privateKey, subject };
}

// ─── Channel Handler ──────────────────────────────────────────

/**
 * Send browser push notifications for a batch of alerts.
 * Iterates over all push subscriptions for the user.
 * Expired/invalid subscriptions are automatically removed.
 */
export async function sendPushNotification(
  userId: string,
  _email: string,
  alerts: Alert[],
  _config: Record<string, unknown>,
): Promise<void> {
  const vapid = getVapid();

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  // Send one notification per alert (most recent first, capped at 5)
  const toSend = alerts.slice(0, 5);

  for (const sub of subscriptions) {
    const pushSub: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    for (const alert of toSend) {
      const payload = JSON.stringify({
        title: `[${alert.severity.toUpperCase()}] ${alert.source}`,
        body: alert.title + (alert.description ? ` — ${alert.description.slice(0, 120)}` : ""),
        icon: "/icon-192.png",
        badge: "/icon-badge.png",
        data: {
          url: alert.url ?? "/",
          alertId: alert.id,
        },
      });

      try {
        await webpush.sendNotification(pushSub, payload);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404 or 410 = subscription expired, remove it
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          break; // No point sending more to this dead subscription
        }
        throw err;
      }
    }
  }
}

/**
 * Send a test push notification to all subscriptions for a user.
 */
export async function sendTestPush(userId: string): Promise<void> {
  const vapid = getVapid();

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    throw new Error("No push subscriptions found — enable browser notifications first");
  }

  const payload = JSON.stringify({
    title: "StatusMonitor — Test",
    body: "Your browser push notifications are configured correctly!",
    icon: "/icon-192.png",
    badge: "/icon-badge.png",
    data: { url: "/dashboard/settings" },
  });

  const errors: string[] = [];

  for (const sub of subscriptions) {
    const pushSub: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    try {
      await webpush.sendNotification(pushSub, payload);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        errors.push("Subscription expired and was removed");
      } else {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  if (errors.length > 0 && errors.length === subscriptions.length) {
    throw new Error(`All push sends failed: ${errors[0]}`);
  }
}
