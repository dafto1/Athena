import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const submitSchema = z.object({
  questionOrder: z.array(z.string().cuid()).min(1).max(20),
  answers: z.array(z.object({
    questionId: z.string().cuid(),
    selectedOptionId: z.string().cuid().nullable(),
    optionOrder: z.array(z.string().cuid()).length(4),
  })).min(1).max(20),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to save this attempt." }, { status: 401 });
  const { id } = await params;
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Your answers could not be submitted." }, { status: 400 });

  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: user.id },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz) return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
  const { questionOrder, answers } = parsed.data;
  const expectedQuestions = new Set(quiz.questions.map((question) => question.id));
  if (questionOrder.length !== expectedQuestions.size || new Set(questionOrder).size !== expectedQuestions.size || questionOrder.some((questionId) => !expectedQuestions.has(questionId))) {
    return NextResponse.json({ message: "This quiz order is invalid. Reload and try again." }, { status: 400 });
  }
  if (answers.length !== expectedQuestions.size || new Set(answers.map((answer) => answer.questionId)).size !== expectedQuestions.size) {
    return NextResponse.json({ message: "Answer every question before submitting." }, { status: 400 });
  }

  const byQuestion = new Map(quiz.questions.map((question) => [question.id, question]));
  let score = 0;
  const persistedAnswers = answers.map((answer) => {
    const question = byQuestion.get(answer.questionId)!;
    const validOptions = new Set(question.options.map((option) => option.id));
    if (answer.optionOrder.length !== validOptions.size || new Set(answer.optionOrder).size !== validOptions.size || answer.optionOrder.some((optionId) => !validOptions.has(optionId))) {
      return null;
    }
    if (answer.selectedOptionId && !validOptions.has(answer.selectedOptionId)) return null;
    const isCorrect = Boolean(answer.selectedOptionId && question.options.some((option) => option.id === answer.selectedOptionId && option.isCorrect));
    if (isCorrect) score += 1;
    return { ...answer, isCorrect };
  });
  if (persistedAnswers.some((answer) => answer === null)) return NextResponse.json({ message: "An answer option was invalid. Reload and try again." }, { status: 400 });

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id, userId: user.id, score, totalQuestions: quiz.questions.length, questionOrder,
      answers: { create: persistedAnswers.map((answer) => ({
        questionId: answer!.questionId,
        selectedOptionId: answer!.selectedOptionId,
        isCorrect: answer!.isCorrect,
        optionOrder: answer!.optionOrder,
      })) },
    },
    include: { answers: { include: { question: { include: { options: true } } } } },
  });
  return NextResponse.json(attempt, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
