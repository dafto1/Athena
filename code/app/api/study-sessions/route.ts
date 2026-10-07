import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const studySessionSchema = z.object({
  durationMin: z.number().int().min(1).max(180), // REQ-TIMER-008
  startedAt: z.string().datetime(),
});

/** REQ-TIMER-006 / REQ-TIMER-007: Record a completed session for the current user. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const parsed = studySessionSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ message: "Invalid study session." }, { status: 400 });

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      durationMin: parsed.data.durationMin,
      startedAt: new Date(parsed.data.startedAt),
    },
  });

  return NextResponse.json(session, { status: 201 });
}

/** Fetch all sessions belonging to the authenticated user (newest first). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(sessions);
}