import { schedule, type ScheduledTask } from "node-cron";
import { prisma } from "@/lib/db";

// Retention periods (in days)
const ALERT_RETENTION_DAYS = 30;
const POLL_LOG_RETENTION_DAYS = 7;
const NOTIFICATION_LOG_RETENTION_DAYS = 30;

let cleanupTask: ScheduledTask | null = null;

/**
 * Start the daily cleanup job.
 * Runs at 03:00 UTC every day.
 */
export function startCleanupJob() {
  if (cleanupTask) return;

  // Run daily at 03:00 UTC
  cleanupTask = schedule("0 3 * * *", async () => {
    await runCleanup();
  });

  console.log("[cleanup] Daily cleanup job scheduled (03:00 UTC)");
}

export function stopCleanupJob() {
  cleanupTask?.stop();
  cleanupTask = null;
  console.log("[cleanup] Stopped");
}

async function runCleanup() {
  const now = new Date();

  try {
    // Delete resolved alerts older than retention period
    const alertCutoff = new Date(
      now.getTime() - ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        status: "resolved",
        updatedAt: { lt: alertCutoff },
      },
    });

    // Delete old PollLog entries
    const pollLogCutoff = new Date(
      now.getTime() - POLL_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const deletedPollLogs = await prisma.pollLog.deleteMany({
      where: { startedAt: { lt: pollLogCutoff } },
    });

    // Delete old NotificationLog entries
    const notifLogCutoff = new Date(
      now.getTime() - NOTIFICATION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const deletedNotifLogs = await prisma.notificationLog.deleteMany({
      where: { sentAt: { lt: notifLogCutoff } },
    });

    console.log(
      `[cleanup] Purged: ${deletedAlerts.count} resolved alerts, ` +
        `${deletedPollLogs.count} poll logs, ${deletedNotifLogs.count} notification logs`,
    );
  } catch (err) {
    console.error("[cleanup] Failed:", err);
  }
}
