import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateFilters } from "@/lib/email-subscriptions";
import { sendTestSlack } from "@/lib/notifications/slack";
import { sendTestTeams } from "@/lib/notifications/teams";
import { subscriptionRateLimited } from "@/lib/subscription-rate-limit";
import { createWebhookManageToken, encryptWebhook, isSlackWebhook, isTeamsWebhook, verifyWebhookManageToken } from "@/lib/webhook-subscriptions";

export const runtime = "nodejs";

const schema = z.object({
  channel: z.enum(["slack", "teams"]),
  webhookUrl: z.string().url().max(600),
  severities: z.array(z.string()).max(4),
  sources: z.array(z.string()).max(100).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    const validWebhook = input.channel === "slack"
      ? isSlackWebhook(input.webhookUrl)
      : isTeamsWebhook(input.webhookUrl);
    if (!validWebhook) {
      return NextResponse.json({ error: `Enter a valid ${input.channel === "slack" ? "Slack" : "Teams"} webhook URL.` }, { status: 400 });
    }
    const ip = request.headers.get("cf-connecting-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown";
    if (subscriptionRateLimited(`webhook:${ip}`)) {
      return NextResponse.json({ error: "Too many connection attempts. Try again later." }, { status: 429 });
    }
    const filters = validateFilters(input.severities, input.sources);
    if (input.channel === "slack") await sendTestSlack(input.webhookUrl);
    else await sendTestTeams(input.webhookUrl);
    const subscription = await prisma.webhookSubscription.create({
      data: {
        channel: input.channel,
        webhookSecret: encryptWebhook(input.webhookUrl),
        severityFilter: JSON.stringify(filters.severities),
        sourceFilter: JSON.stringify(filters.sources),
      },
    });
    return NextResponse.json({ id: subscription.id, token: createWebhookManageToken(subscription.id) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Check the Slack connection settings." }, { status: 400 });
    console.error("Slack subscription failed", error);
    return NextResponse.json({ error: "Slack rejected the webhook or the connection could not be saved." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyWebhookManageToken(id, token)) return NextResponse.json({ error: "Invalid connection" }, { status: 401 });
  await prisma.webhookSubscription.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
