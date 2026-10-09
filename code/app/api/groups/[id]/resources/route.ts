import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shareResourceSchema } from "@/lib/validations/group";

// REQ-GROUP-006, REQ-GROUP-007, REQ-GROUP-008: List shared resources for group members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const whereClause: any = { groupId: id };
  if (folderId && folderId !== "all") {
    whereClause.folderId = folderId === "root" ? null : folderId;
  }

  const resources = await prisma.groupResource.findMany({
    where: whereClause,
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
      folder: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resources);
}

// REQ-GROUP-005: Authorized students can share supported resources with a study group
// REQ-GROUP-006: Permissions verification before making resource available
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Verify group membership
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json(
      { message: "You must be a member of this study group to share resources." },
      { status: 403 }
    );
  }

  const json = await request.json();
  const parsed = shareResourceSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  // Verify student owns the resource
  const userResource = await prisma.resource.findFirst({
    where: { id: parsed.data.resourceId, userId: user.id },
  });

  if (!userResource) {
    return NextResponse.json(
      { message: "Resource not found or you do not have permission to share it." },
      { status: 404 }
    );
  }

  // Check if already shared in this group
  const alreadyShared = await prisma.groupResource.findUnique({
    where: {
      groupId_resourceId: {
        groupId: id,
        resourceId: parsed.data.resourceId,
      },
    },
  });

  if (alreadyShared) {
    return NextResponse.json(
      { message: "This resource is already shared in this study group." },
      { status: 400 }
    );
  }

  // If folderId is provided, verify it belongs to this group
  if (parsed.data.folderId) {
    const folder = await prisma.studyGroupFolder.findFirst({
      where: { id: parsed.data.folderId, groupId: id },
    });
    if (!folder) {
      return NextResponse.json({ message: "Specified folder not found in this group." }, { status: 400 });
    }
  }

  const shared = await prisma.groupResource.create({
    data: {
      groupId: id,
      resourceId: parsed.data.resourceId,
      sharedById: user.id,
      folderId: parsed.data.folderId || null,
    },
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
      folder: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(shared, { status: 201 });
}
