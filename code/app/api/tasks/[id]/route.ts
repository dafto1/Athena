import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations/task";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid task update information." },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    const dataToUpdate: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) dataToUpdate.title = parsed.data.title;
    if (parsed.data.description !== undefined) dataToUpdate.description = parsed.data.description;
    if (parsed.data.priority !== undefined) dataToUpdate.priority = parsed.data.priority;
    if (parsed.data.dueDate !== undefined) {
      dataToUpdate.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
    if (parsed.data.completed !== undefined) {
      dataToUpdate.completed = parsed.data.completed;
      dataToUpdate.completedAt = parsed.data.completed ? new Date() : null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Failed to update task." }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true, id });
}
