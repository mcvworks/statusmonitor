import type { Alert } from "@/generated/prisma/client";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff6b6b",
  major: "#FA6216",
  minor: "#F2C200",
  info: "#48E0C7",
};

const SEVERITY_EMOJI: Record<string, string> = {
  critical: ":red_circle:",
  major: ":large_orange_circle:",
  minor: ":large_yellow_circle:",
  info: ":large_blue_circle:",
};

/**
 * Send a batched Slack notification for one or more alerts via incoming webhook.
 */
export async function sendSlackNotification(
  _userId: string,
  _email: string,
  alerts: Alert[],
  config: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = config.webhookUrl as string | undefined;
  if (!webhookUrl) {
    throw new Error("Slack webhook URL not configured");
  }

  const payload = buildSlackPayload(alerts);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Slack webhook error (${res.status}): ${text}`);
  }
}

/**
 * Send a test message to verify Slack webhook connectivity.
 */
export async function sendTestSlack(webhookUrl: string): Promise<void> {
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: *DTMonitor — Test notification*\nYour Slack webhook is configured correctly. You will receive alerts based on your severity and source filter settings.",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Built by <https://ducktyped.com|Ducktyped>",
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Slack webhook error (${res.status}): ${text}`);
  }
}

// ─── Payload Builder ──────────────────────────────────────────

function buildSlackPayload(alerts: Alert[]) {
  const highestSeverity = getHighestSeverity(alerts);
  const emoji = SEVERITY_EMOJI[highestSeverity] ?? ":warning:";

  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${alerts.length} new alert${alerts.length > 1 ? "s" : ""} detected`,
        emoji: true,
      },
    },
  ];

  for (const alert of alerts) {
    const sevEmoji = SEVERITY_EMOJI[alert.severity] ?? ":warning:";
    const description = alert.description
      ? `\n${alert.description.slice(0, 200)}`
      : "";

    const section: Record<string, unknown> = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${sevEmoji} *${escapeSlack(alert.title)}*\n_${escapeSlack(alert.source)}_ · \`${alert.severity}\`${description}`,
      },
    };

    if (alert.url) {
      section.accessory = {
        type: "button",
        text: { type: "plain_text", text: "View details", emoji: true },
        url: alert.url,
        action_id: `view_${alert.id}`,
      };
    }

    blocks.push(section);
    blocks.push({ type: "divider" });
  }

  // Footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `${emoji} DTMonitor · Built by <https://ducktyped.com|Ducktyped>`,
      },
    ],
  });

  return {
    attachments: [
      {
        color: SEVERITY_COLORS[highestSeverity] ?? "#B8C0CC",
        blocks,
      },
    ],
  };
}

function getHighestSeverity(alerts: Alert[]): string {
  const ranks: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
  let highest = "info";
  let highestRank = 4;
  for (const alert of alerts) {
    const rank = ranks[alert.severity] ?? 4;
    if (rank < highestRank) {
      highest = alert.severity;
      highestRank = rank;
    }
  }
  return highest;
}

function escapeSlack(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
