import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  pinnedServices: z.array(z.string()).default([]),
  selectedServices: z.array(z.string()).default([]),
  filters: z
    .object({
      category: z.string().optional(),
      severity: z.string().optional(),
      status: z.string().optional(),
    })
    .default({}),
  isDefault: z.boolean().default(false),
});

const UpdateDashboardSchema = CreateDashboardSchema.partial().extend({
  id: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dashboards = await prisma.userDashboard.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const parsed = dashboards.map((d) => ({
    ...d,
    layout: JSON.parse(d.layout),
    pinnedServices: JSON.parse(d.pinnedServices),
    filters: JSON.parse(d.filters),
  }));

  return NextResponse.json({ dashboards: parsed });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = CreateDashboardSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { name, pinnedServices, selectedServices, filters, isDefault } =
    result.data;

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.userDashboard.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const dashboard = await prisma.userDashboard.create({
    data: {
      userId: session.user.id,
      name,
      layout: JSON.stringify({ selectedServices }),
      pinnedServices: JSON.stringify(pinnedServices),
      filters: JSON.stringify(filters),
      isDefault,
    },
  });

  return NextResponse.json(
    {
      dashboard: {
        ...dashboard,
        layout: JSON.parse(dashboard.layout),
        pinnedServices: JSON.parse(dashboard.pinnedServices),
        filters: JSON.parse(dashboard.filters),
      },
    },
    { status: 201 },
  );
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = UpdateDashboardSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 },
    );
  }

  const { id, name, pinnedServices, selectedServices, filters, isDefault } =
    result.data;

  // Verify ownership
  const existing = await prisma.userDashboard.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.userDashboard.updateMany({
      where: { userId: session.user.id, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (pinnedServices !== undefined)
    data.pinnedServices = JSON.stringify(pinnedServices);
  if (selectedServices !== undefined)
    data.layout = JSON.stringify({ selectedServices });
  if (filters !== undefined) data.filters = JSON.stringify(filters);
  if (isDefault !== undefined) data.isDefault = isDefault;

  const dashboard = await prisma.userDashboard.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    dashboard: {
      ...dashboard,
      layout: JSON.parse(dashboard.layout),
      pinnedServices: JSON.parse(dashboard.pinnedServices),
      filters: JSON.parse(dashboard.filters),
    },
  });
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

  // Verify ownership
  const existing = await prisma.userDashboard.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.userDashboard.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
