import { QuizAttemptPage } from "@/components/quiz/quiz-attempt";

export default async function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizAttemptPage quizId={id} />;
}
