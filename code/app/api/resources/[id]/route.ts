import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedResource } from "@/lib/resources";
import { resourceRenameSchema } from "@/lib/validations/resource";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const resource = await getOwnedResource(user.id, id);
  if (!resource) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...resource,
    fileUrl: `/api/resources/${resource.id}/file`,
  });
}

// REQ-RES-006: Students can rename supported resources & change category
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedResource(user.id, id);

  if (!existing) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = resourceRenameSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      title: parsed.data.title,
      category: parsed.data.category || existing.category,
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  return NextResponse.json({
    ...updated,
    fileUrl: `/api/resources/${updated.id}/file`,
  });
}

// REQ-RES-007: Students can delete resources they no longer require
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedResource(user.id, id);

  if (!existing) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  // Delete DB record directly (all file data & annotations cascade deleted from Neon DB)
  await prisma.resource.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Resource deleted successfully" });
}
