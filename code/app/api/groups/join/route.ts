import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinGroupSchema } from "@/lib/validations/group";

// REQ-GROUP-003: Students can join a study group through the supported invitation mechanism
// REQ-GROUP-004: Athena would maintain membership information for each study group
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const json = await request.json();
  const parsed = joinGroupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid invite code" },
      { status: 400 }
    );
  }

  const group = await prisma.studyGroup.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  });

  if (!group) {
    return NextResponse.json(
      { message: "No study group found with this invite code. Please check and try again." },
      { status: 404 }
    );
  }

  // Check existing membership
  const existingMember = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json(
      { message: "You are already a member of this study group." },
      { status: 400 }
    );
  }

  // Join as MEMBER
  await prisma.studyGroupMember.create({
    data: {
      groupId: group.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({
    message: "Successfully joined study group!",
    groupId: group.id,
  });
}
