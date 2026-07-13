import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(500) }),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await prisma.browserPushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, severityFilter: JSON.stringify(["critical", "major"]) },
    update: { p256dh: keys.p256dh, auth: keys.auth, enabled: true },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json() as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  await prisma.browserPushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ success: true });
}
