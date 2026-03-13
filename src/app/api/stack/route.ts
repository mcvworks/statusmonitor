import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const AddStackSchema = z.object({
  serviceName: z.string().min(1).max(200),
  provider: z.string().min(1).max(100),
  region: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const BulkAddSchema = z.object({
  services: z.array(AddStackSchema).min(1).max(50),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.userStack.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ stack });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Support bulk add (preset stacks)
  const bulkResult = BulkAddSchema.safeParse(body);
  if (bulkResult.success) {
    const entries = await prisma.$transaction(
      bulkResult.data.services.map((s) =>
        prisma.userStack.create({
          data: { userId: session.user!.id!, ...s },
        })
      )
    );
    return NextResponse.json({ stack: entries }, { status: 201 });
  }

  // Single add
  const result = AddStackSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const entry = await prisma.userStack.create({
    data: { userId: session.user.id, ...result.data },
  });

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.userStack.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.userStack.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
