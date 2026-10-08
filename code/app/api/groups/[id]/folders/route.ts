import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFolderSchema } from "@/lib/validations/group";

// REQ-GROUP-008: Athena can provide shared folders for group resources
export async function GET(
  _request: Request,
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
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const folders = await prisma.studyGroupFolder.findMany({
    where: { groupId: id },
    include: {
      _count: {
        select: { resources: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(folders);
}

// REQ-GROUP-008: Members can create new shared folders in group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = createFolderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid folder name" },
      { status: 400 }
    );
  }

  // Check unique folder name within group
  const existing = await prisma.studyGroupFolder.findUnique({
    where: {
      groupId_name: {
        groupId: id,
        name: parsed.data.name,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { message: "A folder with this name already exists in this study group." },
      { status: 400 }
    );
  }

  const folder = await prisma.studyGroupFolder.create({
    data: {
      name: parsed.data.name,
      groupId: id,
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
