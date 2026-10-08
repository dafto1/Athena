import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations/group";

// REQ-GROUP-006: Athena would restrict shared content according to group permissions
// REQ-GROUP-007: Permitted group members can access resources shared with their group
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Verify membership
  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { message: "You are not a member of this study group." },
      { status: 403 }
    );
  }

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      folders: {
        include: {
          _count: {
            select: { resources: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      resources: {
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              fileName: true,
              fileType: true,
              fileSize: true,
              category: true,
              userId: true,
            },
          },
          sharedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ message: "Study group not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...group,
    role: membership.role,
  });
}

// REQ-GROUP-002, REQ-GROUP-010: Only group admins can update group details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: user.id,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Only group admins can update study group settings." },
      { status: 403 }
    );
  }

  const json = await request.json();
  const parsed = createGroupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid group information" },
      { status: 400 }
    );
  }

  const updated = await prisma.studyGroup.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  return NextResponse.json(updated);
}

// REQ-GROUP-010: Admins delete group; members leave group
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: id,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ message: "Group not found or not a member" }, { status: 404 });
  }

  if (membership.role === "ADMIN") {
    // Delete entire study group
    await prisma.studyGroup.delete({ where: { id } });
    return NextResponse.json({ message: "Study group deleted successfully" });
  }

  // Member leaves group
  await prisma.studyGroupMember.delete({
    where: {
      groupId_userId: {
        groupId: id,
        userId: user.id,
      },
    },
  });

  return NextResponse.json({ message: "Left study group successfully" });
}
