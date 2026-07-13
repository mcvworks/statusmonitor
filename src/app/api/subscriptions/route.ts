import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  CONFIRMATION_TTL_MS,
  createConfirmationToken,
  normalizeEmail,
  validateFilters,
} from "@/lib/email-subscriptions";
import { sendSubscriptionConfirmation } from "@/lib/notifications/email";
import { subscriptionRateLimited } from "@/lib/subscription-rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email().max(254),
  severities: z.array(z.string()).max(4),
  sources: z.array(z.string()).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const email = normalizeEmail(body.email);
    const filters = validateFilters(body.severities, body.sources);
    const ip = request.headers.get("cf-connecting-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown";

    if (subscriptionRateLimited(`ip:${ip}`) || subscriptionRateLimited(`email:${email}`)) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const { token, hash } = createConfirmationToken();
    const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);

    await prisma.emailSubscription.upsert({
      where: { email },
      create: {
        email,
        pendingSeverityFilter: JSON.stringify(filters.severities),
        pendingSourceFilter: JSON.stringify(filters.sources),
        confirmationTokenHash: hash,
        confirmationExpiresAt: expiresAt,
      },
      update: {
        pendingSeverityFilter: JSON.stringify(filters.severities),
        pendingSourceFilter: JSON.stringify(filters.sources),
        confirmationTokenHash: hash,
        confirmationExpiresAt: expiresAt,
      },
    });

    await sendSubscriptionConfirmation(email, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || (error instanceof Error && error.message.startsWith("Invalid"))) {
      return NextResponse.json({ error: "Check your email and alert selections." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Select at least one severity") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Subscription request failed", error);
    return NextResponse.json(
      { error: "We could not send the confirmation email. Please try again shortly." },
      { status: 503 },
    );
  }
}
