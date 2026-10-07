import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resourceRenameSchema } from "@/lib/validations/resource";
import { unlink } from "fs/promises";
import path from "path";

// REQ-RES-006: Students can rename supported resources & change category
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.resource.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
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
  });

  return NextResponse.json(updated);
}

// REQ-RES-007: Students can delete resources they no longer require
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.resource.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  // Delete DB record
  await prisma.resource.delete({
    where: { id },
  });

  // Try removing file from disk
  try {
    if (existing.fileUrl.startsWith("/uploads/resources/")) {
      const relativePath = existing.fileUrl.replace("/uploads/resources/", "");
      const fullPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "resources",
        relativePath
      );
      await unlink(fullPath).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to delete physical file:", err);
  }

  return NextResponse.json({ message: "Resource deleted successfully" });
}
