export type QuizOption = { id: string; text: string; position: number; isCorrect?: boolean };
export type QuizQuestion = { id: string; prompt: string; explanation: string; position: number; options: QuizOption[] };
export type QuizAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  optionOrder: unknown;
  question: QuizQuestion;
};
export type QuizAttempt = {
  id: string;
  score: number;
  totalQuestions: number;
  questionOrder: unknown;
  createdAt: string;
  answers: QuizAnswer[];
};
export type QuizDetail = {
  id: string;
  title: string;
  resource: { title: string };
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
};

export function jsonIdList(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}
