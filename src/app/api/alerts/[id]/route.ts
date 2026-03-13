import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const AlertStateBody = z.object({
  state: z.enum(["acknowledged", "snoozed", "dismissed"]),
  snoozedUntil: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: alertId } = await params;

  // Verify alert exists
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = AlertStateBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { state, snoozedUntil } = parsed.data;

  const alertState = await prisma.userAlertState.upsert({
    where: {
      userId_alertId: {
        userId: session.user.id,
        alertId,
      },
    },
    create: {
      userId: session.user.id,
      alertId,
      state,
      snoozedUntil: state === "snoozed" && snoozedUntil ? new Date(snoozedUntil) : null,
    },
    update: {
      state,
      snoozedUntil: state === "snoozed" && snoozedUntil ? new Date(snoozedUntil) : null,
    },
  });

  return NextResponse.json({ alertState });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: alertId } = await params;

  await prisma.userAlertState.deleteMany({
    where: {
      userId: session.user.id,
      alertId,
    },
  });

  return NextResponse.json({ success: true });
}
