import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations/group";
import crypto from "crypto";

// REQ-GROUP-004: Athena would maintain membership information for each study group
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const memberships = await prisma.studyGroupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          _count: {
            select: {
              members: true,
              resources: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    ...m.group,
    role: m.role,
  }));

  return NextResponse.json(groups);
}

// REQ-GROUP-001: Students can create study groups
// REQ-GROUP-002: A study-group creator can provide basic information about the group
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const json = await request.json();
  const parsed = createGroupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid group information" },
      { status: 400 }
    );
  }

  // Generate unique 6-char uppercase alphanumeric invite code (REQ-GROUP-003)
  const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  const group = await prisma.studyGroup.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      inviteCode,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN", // Creator is automatically group ADMIN
        },
      },
      folders: {
        create: {
          name: "General", // Default shared folder (REQ-GROUP-008)
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          resources: true,
        },
      },
    },
  });

  return NextResponse.json({ ...group, role: "ADMIN" }, { status: 201 });
}
