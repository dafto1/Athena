import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
  }

  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      completedAt: parsed.data.completed === true ? new Date() : parsed.data.completed === false ? null : task.completedAt,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}