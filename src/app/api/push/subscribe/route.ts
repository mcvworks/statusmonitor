import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// ─── POST: Save push subscription ────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = SubscriptionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid subscription", details: result.error.issues },
      { status: 400 },
    );
  }

  const { endpoint, keys } = result.data;
  const userId = session.user.id;

  // Upsert by endpoint to avoid duplicates
  const existing = await prisma.pushSubscription.findFirst({
    where: { userId, endpoint },
  });

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { p256dh: keys.p256dh, auth: keys.auth },
    });
  } else {
    await prisma.pushSubscription.create({
      data: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
  }

  return NextResponse.json({ success: true });
}

// ─── DELETE: Remove push subscription ─────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint } = body as { endpoint?: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  });

  return NextResponse.json({ success: true });
}
