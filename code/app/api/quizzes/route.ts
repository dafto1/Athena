import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateResourceQuiz } from "@/lib/nemo";
import { prisma } from "@/lib/prisma";
import { extractResourceText } from "@/lib/resource-text";

const createQuizSchema = z.object({
  resourceId: z.string().cuid(),
  topic: z.string().trim().max(160).optional().default(""),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view your quizzes." }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      resource: { select: { id: true, title: true } },
      _count: { select: { questions: true } },
      attempts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, score: true, totalQuestions: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(quizzes, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to create a quiz." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Choose a resource and try again." }, { status: 400 });

  const resource = await prisma.resource.findFirst({
    where: { id: parsed.data.resourceId, userId: user.id },
    select: { id: true, title: true, fileName: true, fileType: true, fileData: true, extractedText: true },
  });
  if (!resource) return NextResponse.json({ message: "Resource not found." }, { status: 404 });
  let sourceText = resource.extractedText ?? "";
  if (sourceText.trim().length < 100) {
    try {
      sourceText = await extractResourceText(resource.fileName, resource.fileType, Buffer.from(resource.fileData)) ?? "";
    } catch (error) {
      console.warn(`Could not extract quiz source text from ${resource.fileName}:`, error);
      sourceText = "";
    }
    if (sourceText.trim().length >= 100) {
      await prisma.resource.update({ where: { id: resource.id }, data: { extractedText: sourceText } });
    }
  }
  if (sourceText.trim().length < 100) {
    return NextResponse.json({ message: "No readable text was found in this resource." }, { status: 422 });
  }

  try {
    const generated = await generateResourceQuiz(resource.title, sourceText, parsed.data.topic);
    const quiz = await prisma.quiz.create({
      data: {
        title: generated.title,
        userId: user.id,
        resourceId: resource.id,
        questions: {
          create: generated.questions.map((question, questionIndex) => ({
            prompt: question.prompt,
            explanation: question.explanation,
            position: questionIndex,
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option,
                position: optionIndex,
                isCorrect: optionIndex === question.correctOptionIndex,
              })),
            },
          })),
        },
      },
      select: { id: true, title: true },
    });
    return NextResponse.json({ ...quiz, questionCount: generated.questions.length }, { status: 201 });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    const message = error instanceof Error && error.message.includes("needs GOOGLE_API_KEY")
      ? error.message
      : "Nemo couldn’t generate this quiz. Try again with a different resource or topic.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
