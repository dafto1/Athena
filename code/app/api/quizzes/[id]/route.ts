import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view this quiz." }, { status: 401 });
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: user.id },
    include: {
      resource: { select: { title: true } },
      questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" }, select: { id: true, text: true, position: true } } } },
      attempts: {
        where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10,
        include: {
          answers: {
            include: {
              question: { include: { options: { orderBy: { position: "asc" } } } },
            },
          },
        },
      },
    },
  });
  if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
  return NextResponse.json(quiz, { headers: { "Cache-Control": "private, no-store" } });
}
