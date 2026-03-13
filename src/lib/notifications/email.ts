import type { Alert } from "@/generated/prisma/client";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff6b6b",
  major: "#FA6216",
  minor: "#F2C200",
  info: "#48E0C7",
};

/**
 * Send a batched email notification for one or more alerts.
 * Uses Resend SDK if RESEND_API_KEY is set, otherwise falls back to nodemailer SMTP.
 */
export async function sendEmailNotification(
  _userId: string,
  email: string,
  alerts: Alert[],
  _config: Record<string, unknown>,
): Promise<void> {
  const severitySummary = buildSeveritySummary(alerts);
  const subject = `[StatusMonitor] ${alerts.length} new alert${alerts.length > 1 ? "s" : ""} — ${severitySummary}`;
  const html = buildEmailHTML(alerts);

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(email, subject, html);
  } else {
    await sendViaSMTP(email, subject, html);
  }
}

/**
 * Send a test notification email to verify configuration.
 */
export async function sendTestEmail(email: string): Promise<void> {
  const subject = "[StatusMonitor] Test notification";
  const html = buildTestEmailHTML();

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(email, subject, html);
  } else {
    await sendViaSMTP(email, subject, html);
  }
}

// ─── Senders ────────────────────────────────────────────────────

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const from = process.env.EMAIL_FROM ?? "alerts@monitor.ducktyped.com";

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

async function sendViaSMTP(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const nodemailer = await import("nodemailer");

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  const from = process.env.EMAIL_FROM ?? "alerts@monitor.ducktyped.com";

  await transport.sendMail({ from, to, subject, html });
}

// ─── Email Templates ────────────────────────────────────────────

function buildSeveritySummary(alerts: Alert[]): string {
  const counts: Record<string, number> = {};
  for (const alert of alerts) {
    counts[alert.severity] = (counts[alert.severity] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => severityRank(a) - severityRank(b))
    .map(([sev, count]) => `${count} ${sev}`)
    .join(", ");
}

function severityRank(s: string): number {
  const ranks: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
  return ranks[s] ?? 4;
}

function buildEmailHTML(alerts: Alert[]): string {
  const alertRows = alerts
    .map((alert) => {
      const color = SEVERITY_COLORS[alert.severity] ?? "#B8C0CC";
      const link = alert.url
        ? `<a href="${escapeHtml(alert.url)}" style="color: #F2C200; text-decoration: none;">View details &rarr;</a>`
        : "";
      return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #232A35;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${color}20; color: ${color}; font-size: 11px; font-weight: 600; text-transform: uppercase; font-family: 'Fira Code', monospace;">
            ${escapeHtml(alert.severity)}
          </span>
          <span style="color: #8892A0; font-size: 12px; margin-left: 8px; font-family: 'Fira Code', monospace;">
            ${escapeHtml(alert.source)}
          </span>
          <div style="margin-top: 6px; color: #E9EEF5; font-size: 14px; font-weight: 500;">
            ${escapeHtml(alert.title)}
          </div>
          ${alert.description ? `<div style="margin-top: 4px; color: #B8C0CC; font-size: 13px;">${escapeHtml(alert.description).slice(0, 200)}</div>` : ""}
          <div style="margin-top: 6px;">${link}</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0F1114; font-family: 'Space Grotesk', -apple-system, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="text-align: center; padding: 24px 0;">
      <h1 style="color: #F2C200; font-family: 'Orbitron', sans-serif; font-size: 20px; margin: 0;">
        StatusMonitor
      </h1>
      <p style="color: #8892A0; font-size: 13px; margin-top: 4px;">
        ${alerts.length} new alert${alerts.length > 1 ? "s" : ""} detected
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; background: #151A22; border-radius: 12px; overflow: hidden;">
      ${alertRows}
    </table>

    <div style="text-align: center; padding: 24px 0; color: #8892A0; font-size: 12px;">
      <a href="${process.env.AUTH_URL ?? "https://monitor.ducktyped.com"}/dashboard/settings" style="color: #F2C200; text-decoration: none;">
        Manage notification preferences
      </a>
      <br><br>
      Built by <a href="https://ducktyped.com" style="color: #48E0C7; text-decoration: none;">Ducktyped</a>
    </div>
  </div>
</body>
</html>`;
}

function buildTestEmailHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0F1114; font-family: 'Space Grotesk', -apple-system, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="text-align: center; padding: 24px 0;">
      <h1 style="color: #F2C200; font-family: 'Orbitron', sans-serif; font-size: 20px; margin: 0;">
        StatusMonitor
      </h1>
    </div>

    <div style="background: #151A22; border-radius: 12px; padding: 24px; text-align: center;">
      <div style="color: #48E0C7; font-size: 32px; margin-bottom: 12px;">&#10003;</div>
      <h2 style="color: #E9EEF5; font-size: 18px; margin: 0 0 8px;">Test notification received!</h2>
      <p style="color: #B8C0CC; font-size: 14px; margin: 0;">
        Your email notifications are configured correctly. You will receive alerts based on your severity and source filter settings.
      </p>
    </div>

    <div style="text-align: center; padding: 24px 0; color: #8892A0; font-size: 12px;">
      Built by <a href="https://ducktyped.com" style="color: #48E0C7; text-decoration: none;">Ducktyped</a>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
