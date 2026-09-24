import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl, hashToken } from "@/lib/email-subscriptions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  // Behind the reverse proxy request.url can contain the standalone server's
  // 0.0.0.0:3002 bind address. Use the same public origin as emailed links.
  const destination = new URL(appUrl("/subscribe/confirmed"));
  if (!token) {
    destination.searchParams.set("status", "invalid");
    return NextResponse.redirect(destination);
  }

  const subscription = await prisma.emailSubscription.findFirst({
    where: {
      confirmationTokenHash: hashToken(token),
      confirmationExpiresAt: { gt: new Date() },
    },
  });

  if (!subscription?.pendingSeverityFilter || !subscription.pendingSourceFilter) {
    destination.searchParams.set("status", "invalid");
    return NextResponse.redirect(destination);
  }

  await prisma.emailSubscription.update({
    where: { id: subscription.id },
    data: {
      enabled: true,
      verifiedAt: new Date(),
      severityFilter: subscription.pendingSeverityFilter,
      sourceFilter: subscription.pendingSourceFilter,
      pendingSeverityFilter: null,
      pendingSourceFilter: null,
      confirmationTokenHash: null,
      confirmationExpiresAt: null,
    },
  });

  destination.searchParams.set("status", "confirmed");
  return NextResponse.redirect(destination);
}
