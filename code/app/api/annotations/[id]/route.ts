import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { annotationUpdateSchema } from "@/lib/validations/annotation";

async function getOwnedAnnotation(userId: string, id: string) {
  return prisma.annotation.findFirst({ where: { id, userId } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAnnotation(user.id, id);
  if (!existing) {
    return NextResponse.json({ message: "Annotation not found" }, { status: 404 });
  }

  const parsed = annotationUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid annotation update." },
      { status: 400 }
    );
  }

  const updated = await prisma.annotation.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedAnnotation(user.id, id);
  if (!existing) {
    return NextResponse.json({ message: "Annotation not found" }, { status: 404 });
  }

  await prisma.annotation.delete({ where: { id } });
  return NextResponse.json({ success: true, id });
}
