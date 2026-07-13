import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateFilters, verifyManageToken } from "@/lib/email-subscriptions";

export const runtime = "nodejs";

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
  if (!valid) return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  const subscription = await prisma.emailSubscription.findUnique({ where: { id } });
  if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  return NextResponse.json({
    email: subscription.email,
    enabled: subscription.enabled,
    severities: JSON.parse(subscription.severityFilter),
    sources: JSON.parse(subscription.sourceFilter),
  });
}

export async function PUT(request: NextRequest) {
  const { id, valid } = credentials(request);
  if (!valid) return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  try {
    const body = updateSchema.parse(await request.json());
    const filters = validateFilters(body.severities, body.sources);
    await prisma.emailSubscription.update({
      where: { id },
      data: {
        enabled: true,
        severityFilter: JSON.stringify(filters.severities),
        sourceFilter: JSON.stringify(filters.sources),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) {
      return NextResponse.json({ error: "Check your alert selections." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save preferences" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { id, valid } = credentials(request);
  if (!valid) return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  await prisma.emailSubscription.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
