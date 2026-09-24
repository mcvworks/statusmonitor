import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { appUrl, createManageToken, normalizeEmail, validateFilters, verifyManageToken } from "@/lib/email-subscriptions";
import { sendSubscriptionManageLink } from "@/lib/notifications/email";
import { subscriptionRateLimited } from "@/lib/subscription-rate-limit";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const parsed = z.object({ email: z.string().email().max(254) }).safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return json({ error: "Enter a valid email address." }, 400);
  const email = normalizeEmail(parsed.data.email);
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  if (subscriptionRateLimited(`manage-ip:${ip}`) || subscriptionRateLimited(`manage-email:${email}`)) {
    return json({ error: "Too many requests. Try again later." }, 429);
  }
  try {
    const subscription = await prisma.emailSubscription.findUnique({ where: { email }, select: { id: true } });
    if (subscription) {
      const params = new URLSearchParams({ id: subscription.id, token: createManageToken(subscription.id) });
      await sendSubscriptionManageLink(email, appUrl(`/subscribe/manage?${params}`));
    }
    // The response must not reveal whether someone else's address is subscribed.
    return json({ ok: true });
  } catch {
    console.error("Unable to send an email-alert management link");
    return json({ error: "Unable to process your request right now. Please try again shortly." }, 503);
  }
}

const updateSchema = z.object({
  severities: z.array(z.string()).max(4),
  sources: z.array(z.string()).max(100),
});

function credentials(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  return { id, valid: verifyManageToken(id, token) };
}

export async function GET(request: NextRequest) {
  const { id, valid } = credentials(request);
  if (!valid) return json({ error: "Invalid link" }, 401);
  const subscription = await prisma.emailSubscription.findUnique({ where: { id } });
  if (!subscription) return json({ error: "Subscription not found" }, 404);
  return json({
    email: subscription.email,
    enabled: subscription.enabled,
    confirmed: Boolean(subscription.verifiedAt),
    severities: JSON.parse(subscription.severityFilter),
    sources: JSON.parse(subscription.sourceFilter),
  });
}

export async function PUT(request: NextRequest) {
  const { id, valid } = credentials(request);
  if (!valid) return json({ error: "Invalid link" }, 401);
  try {
    const body = updateSchema.parse(await request.json());
    const filters = validateFilters(body.severities, body.sources);
    const subscription = await prisma.emailSubscription.findUnique({ where: { id }, select: { verifiedAt: true } });
    if (!subscription) return json({ error: "This subscription is no longer active." }, 404);
    if (!subscription.verifiedAt) return json({ error: "Confirm your subscription email before changing preferences. You can still unsubscribe." }, 409);
    await prisma.emailSubscription.update({
      where: { id },
      data: {
        enabled: true,
        severityFilter: JSON.stringify(filters.severities),
        sourceFilter: JSON.stringify(filters.sources),
      },
    });
    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) {
      return json({ error: "Check your alert selections." }, 400);
    }
    return json({ error: "Unable to save preferences" }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { id, valid } = credentials(request);
  if (!valid) return json({ error: "Invalid link" }, 401);
  await prisma.emailSubscription.deleteMany({ where: { id } });
  return json({ ok: true });
}
