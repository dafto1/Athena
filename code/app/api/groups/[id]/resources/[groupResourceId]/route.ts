import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// REQ-GROUP-010: Students without required permission cannot modify protected group resources
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; groupResourceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id: groupId, groupResourceId } = await params;

  // Verify group membership
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const groupResource = await prisma.groupResource.findUnique({
    where: { id: groupResourceId },
  });

  if (!groupResource || groupResource.groupId !== groupId) {
    return NextResponse.json({ message: "Shared resource not found" }, { status: 404 });
  }

  // Permission check (REQ-GROUP-010): Only sharer or group ADMIN can remove
  const canDelete = groupResource.sharedById === user.id || membership.role === "ADMIN";
  if (!canDelete) {
    return NextResponse.json(
      { message: "You do not have permission to remove this resource. Only the uploader or group admin can unshare it." },
      { status: 403 }
    );
  }

  await prisma.groupResource.delete({
    where: { id: groupResourceId },
  });

  return NextResponse.json({ message: "Resource removed from study group." });
}

// REQ-GROUP-008, REQ-GROUP-010: Move resource to another folder
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; groupResourceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id: groupId, groupResourceId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const groupResource = await prisma.groupResource.findUnique({
    where: { id: groupResourceId },
  });

  if (!groupResource || groupResource.groupId !== groupId) {
    return NextResponse.json({ message: "Shared resource not found" }, { status: 404 });
  }

  // Permission check: sharer or admin can organize
  const canModify = groupResource.sharedById === user.id || membership.role === "ADMIN";
  if (!canModify) {
    return NextResponse.json(
      { message: "You do not have permission to reorganize this resource." },
      { status: 403 }
    );
  }

  const json = await request.json();
  const folderId = json.folderId ?? null;

  if (folderId) {
    const folder = await prisma.studyGroupFolder.findFirst({
      where: { id: folderId, groupId },
    });
    if (!folder) {
      return NextResponse.json({ message: "Target folder does not exist" }, { status: 400 });
    }
  }

  const updated = await prisma.groupResource.update({
    where: { id: groupResourceId },
    data: { folderId },
    include: {
      folder: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
