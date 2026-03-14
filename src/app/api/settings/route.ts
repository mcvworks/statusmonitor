import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTestEmail } from "@/lib/notifications/email";
import { sendTestSlack } from "@/lib/notifications/slack";
import { sendTestTeams } from "@/lib/notifications/teams";
import { sendTestPush } from "@/lib/notifications/web-push";

// ─── Validation ─────────────────────────────────────────────────

const NotificationPrefSchema = z.object({
  channel: z.enum(["email", "slack", "teams", "push"]),
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).default({}),
  severityFilter: z.array(z.enum(["critical", "major", "minor", "info"])).default([]),
  sourceFilter: z.array(z.string()).default([]),
});

const UpdatePrefsSchema = z.object({
  prefs: z.array(NotificationPrefSchema),
});

const TestNotificationSchema = z.object({
  action: z.literal("test"),
  channel: z.enum(["email", "slack", "teams", "push"]),
});

// ─── GET: Fetch user notification preferences ───────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.userNotificationPref.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const parsed = prefs.map((p) => ({
    id: p.id,
    channel: p.channel,
    enabled: p.enabled,
    config: safeParseJSON(p.config),
    severityFilter: safeParseJSON(p.severityFilter),
    sourceFilter: safeParseJSON(p.sourceFilter),
  }));

  return NextResponse.json({ prefs: parsed });
}

// ─── PUT: Update notification preferences ───────────────────────

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = UpdatePrefsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.issues },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // Upsert each channel preference
  for (const pref of result.data.prefs) {
    const existing = await prisma.userNotificationPref.findFirst({
      where: { userId, channel: pref.channel },
    });

    if (existing) {
      await prisma.userNotificationPref.update({
        where: { id: existing.id },
        data: {
          enabled: pref.enabled,
          config: JSON.stringify(pref.config),
          severityFilter: JSON.stringify(pref.severityFilter),
          sourceFilter: JSON.stringify(pref.sourceFilter),
        },
      });
    } else {
      await prisma.userNotificationPref.create({
        data: {
          userId,
          channel: pref.channel,
          enabled: pref.enabled,
          config: JSON.stringify(pref.config),
          severityFilter: JSON.stringify(pref.severityFilter),
          sourceFilter: JSON.stringify(pref.sourceFilter),
        },
      });
    }
  }

  // Return updated prefs
  const prefs = await prisma.userNotificationPref.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const parsed = prefs.map((p) => ({
    id: p.id,
    channel: p.channel,
    enabled: p.enabled,
    config: safeParseJSON(p.config),
    severityFilter: safeParseJSON(p.severityFilter),
    sourceFilter: safeParseJSON(p.sourceFilter),
  }));

  return NextResponse.json({ prefs: parsed });
}

// ─── POST: Send test notification ───────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = TestNotificationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.issues },
      { status: 400 },
    );
  }

  const { channel } = result.data;

  // For webhook channels, we need the saved config to get the webhook URL
  const getWebhookUrl = async (ch: string): Promise<string | null> => {
    const pref = await prisma.userNotificationPref.findFirst({
      where: { userId: session.user!.id!, channel: ch },
    });
    if (!pref) return null;
    try {
      const config = JSON.parse(pref.config);
      return config.webhookUrl ?? null;
    } catch {
      return null;
    }
  };

  try {
    if (channel === "email") {
      await sendTestEmail(session.user.email);
    } else if (channel === "slack") {
      const webhookUrl = await getWebhookUrl("slack");
      if (!webhookUrl) {
        return NextResponse.json(
          { error: "Save your Slack webhook URL first, then test" },
          { status: 400 },
        );
      }
      await sendTestSlack(webhookUrl);
    } else if (channel === "teams") {
      const webhookUrl = await getWebhookUrl("teams");
      if (!webhookUrl) {
        return NextResponse.json(
          { error: "Save your Teams webhook URL first, then test" },
          { status: 400 },
        );
      }
      await sendTestTeams(webhookUrl);
    } else if (channel === "push") {
      await sendTestPush(session.user.id);
    } else {
      return NextResponse.json(
        { error: `Test not implemented for ${channel} yet` },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function safeParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
