import type { Alert } from "@/generated/prisma/client";

/**
 * Send a batched Teams notification for one or more alerts via incoming webhook.
 * Uses Adaptive Card format.
 */
export async function sendTeamsNotification(
  _userId: string,
  _email: string,
  alerts: Alert[],
  config: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = config.webhookUrl as string | undefined;
  if (!webhookUrl) {
    throw new Error("Teams webhook URL not configured");
  }

  const payload = buildTeamsPayload(alerts);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Teams webhook error (${res.status}): ${text}`);
  }
}

/**
 * Send a test message to verify Teams webhook connectivity.
 */
export async function sendTestTeams(webhookUrl: string): Promise<void> {
  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: "StatusMonitor — Test notification",
              weight: "Bolder",
              size: "Medium",
              color: "Good",
            },
            {
              type: "TextBlock",
              text: "Your Teams webhook is configured correctly. You will receive alerts based on your severity and source filter settings.",
              wrap: true,
            },
            {
              type: "TextBlock",
              text: "Built by [Ducktyped](https://ducktyped.com)",
              size: "Small",
              isSubtle: true,
              wrap: true,
            },
          ],
        },
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
    throw new Error(`Teams webhook error (${res.status}): ${text}`);
  }
}

// ─── Payload Builder ──────────────────────────────────────────

function buildTeamsPayload(alerts: Alert[]) {
  const body: unknown[] = [
    {
      type: "TextBlock",
      text: `${alerts.length} new alert${alerts.length > 1 ? "s" : ""} detected`,
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
  ];

  for (const alert of alerts) {
    body.push({
      type: "Container",
      separator: true,
      items: [
        {
          type: "TextBlock",
          text: alert.title,
          weight: "Bolder",
          wrap: true,
        },
        {
          type: "FactSet",
          facts: [
            { title: "Source", value: alert.source },
            { title: "Severity", value: alert.severity.toUpperCase() },
            { title: "Status", value: alert.status },
            { title: "Time", value: new Date(alert.timestamp).toLocaleString() },
          ],
        },
        ...(alert.description
          ? [
              {
                type: "TextBlock",
                text: alert.description.slice(0, 300),
                wrap: true,
                size: "Small",
                isSubtle: true,
              },
            ]
          : []),
        ...(alert.url
          ? [
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View details",
                    url: alert.url,
                  },
                ],
              },
            ]
          : []),
      ],
    });
  }

  // Footer
  body.push({
    type: "TextBlock",
    text: "StatusMonitor · Built by [Ducktyped](https://ducktyped.com)",
    size: "Small",
    isSubtle: true,
    wrap: true,
    separator: true,
  });

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          msteams: { width: "Full" },
          body,
        },
      },
    ],
  };
}


