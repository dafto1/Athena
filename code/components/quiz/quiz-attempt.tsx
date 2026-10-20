"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, LoaderCircle, RotateCcw, X } from "lucide-react";
import { jsonIdList, type QuizAttempt, type QuizDetail, type QuizQuestion } from "./types";

type Session = { questionOrder: string[]; optionOrder: Record<string, string[]> };
type Mode = "loading" | "error" | "taking" | "review";

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function makeSession(questions: QuizQuestion[]): Session {
  return {
    questionOrder: shuffled(questions.map((question) => question.id)),
    optionOrder: Object.fromEntries(questions.map((question) => [question.id, shuffled(question.options.map((option) => option.id))])),
  };
}

export function QuizAttemptPage({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Record<string, string | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "Could not load quiz.");
        if (!active) return;
        const loaded = body as QuizDetail;
        setQuiz(loaded);
        const latest = loaded.attempts[0] ?? null;
        if (latest) { setAttempt(latest); setMode("review"); }
        else { setAttempt(null); setSession(makeSession(loaded.questions)); setResponses({}); setCurrentIndex(0); setMode("taking"); }
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not load quiz.");
        setMode("error");
      }
    }
    void loadQuiz();
    return () => { active = false; };
  }, [quizId]);

  const questionById = useMemo(() => new Map(quiz?.questions.map((question) => [question.id, question]) ?? []), [quiz]);
  const question = quiz && session ? questionById.get(session.questionOrder[currentIndex]) : undefined;
  const answeredCount = Object.values(responses).filter((value) => value !== undefined).length;

  function beginRetake() {
    if (!quiz) return;
    setSession(makeSession(quiz.questions));
    setResponses({}); setCurrentIndex(0); setAttempt(null); setError(""); setMode("taking");
  }

  async function submitAttempt() {
    if (!session || !quiz) return;
    if (answeredCount < session.questionOrder.length) {
      setError("Answer every question before submitting.");
      return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionOrder: session.questionOrder, answers: session.questionOrder.map((questionId) => ({ questionId, selectedOptionId: responses[questionId] ?? null, optionOrder: session.optionOrder[questionId] })) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Could not save your answers.");
      setAttempt(body as QuizAttempt); setMode("review");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your answers.");
    } finally { setBusy(false); }
  }

  const presentedQuestionIds = attempt ? jsonIdList(attempt.questionOrder).filter((id) => questionById.has(id)) : [];
  const reviewAnswers = useMemo(() => new Map(attempt?.answers.map((answer) => [answer.questionId, answer]) ?? []), [attempt]);

  return <section className="mx-auto max-w-3xl px-5 pb-12 sm:px-8">
    <Link href="/dashboard/quiz" className="inline-flex items-center gap-1.5 text-sm text-[#787774] hover:text-[#37352f]"><ArrowLeft className="h-4 w-4" /> Quizzes</Link>
    {mode === "loading" ? <div className="flex justify-center py-24"><LoaderCircle className="h-6 w-6 animate-spin text-[#a66324]" aria-label="Loading quiz" /></div> : mode === "error" || !quiz ? <div role="alert" className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error || "Quiz not found."}</div> : <>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#ebe9e4] pb-5">
        <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a66324]">{quiz.resource.title}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#37352f]">{quiz.title}</h1></div>
        {mode === "taking" && session && <span className="shrink-0 text-sm tabular-nums text-[#787774]">{currentIndex + 1} <span className="text-[#b7b3ab]">/</span> {session.questionOrder.length}</span>}
      </header>

      {mode === "taking" && session && question && <div className="mt-6">
        <div className="h-1 overflow-hidden rounded-full bg-[#eeece7]"><div className="h-full rounded-full bg-[#b77935] transition-[width]" style={{ width: `${((currentIndex + 1) / session.questionOrder.length) * 100}%` }} /></div>
        <div className="mt-7 rounded-2xl border border-[#e9e5dd] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(55,53,47,.35)] sm:p-7">
          <p className="text-xs font-medium uppercase tracking-wider text-[#a66324]">Question {currentIndex + 1}</p>
          <h2 className="mt-3 text-lg font-medium leading-relaxed text-[#37352f] sm:text-xl">{question.prompt}</h2>
          <fieldset className="mt-6 space-y-2.5">
            <legend className="sr-only">Choose an answer</legend>
            {session.optionOrder[question.id].map((optionId, index) => {
              const option = question.options.find((item) => item.id === optionId)!;
              const selected = responses[question.id] === option.id;
              return <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-relaxed transition focus-within:ring-2 focus-within:ring-[#a66324]/30 ${selected ? "border-[#b77935] bg-[#fbf6ee]" : "border-[#e9e5dd] hover:border-[#c9c2b6] hover:bg-[#fcfbf9]"}`}>
                <input type="radio" name={`question-${question.id}`} value={option.id} checked={selected} onChange={() => setResponses((old) => ({ ...old, [question.id]: option.id }))} className="sr-only" />
                <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-medium ${selected ? "border-[#a66324] bg-[#a66324] text-white" : "border-[#d9d5cd] text-[#787774]"}`}>{String.fromCharCode(65 + index)}</span>
                <span className="pt-0.5 text-[#4a4842]">{option.text}</span>
              </label>;
            })}
          </fieldset>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button disabled={currentIndex === 0 || busy} onClick={() => { setCurrentIndex((index) => index - 1); setError(""); }} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#6b6964] hover:bg-[#f1efeb] disabled:invisible"><ChevronLeft className="h-4 w-4" /> Previous</button>
          {currentIndex < session.questionOrder.length - 1 ? <button onClick={() => { setCurrentIndex((index) => index + 1); setError(""); }} className="inline-flex items-center gap-2 rounded-lg bg-[#37352f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4a4842]">Next <ArrowRight className="h-4 w-4" /></button> : <button disabled={busy || answeredCount < session.questionOrder.length} onClick={submitAttempt} className="inline-flex items-center gap-2 rounded-lg bg-[#37352f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4a4842] disabled:cursor-not-allowed disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? "Saving…" : "Finish quiz"}</button>}
        </div>
      </div>}

      {mode === "review" && attempt && <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e9e5dd] bg-[#fbfaf8] p-5 sm:p-6">
          <div><p className="text-sm text-[#787774]">Your score</p><p className="mt-1 text-3xl font-semibold tracking-tight text-[#37352f]">{attempt.score}<span className="text-lg font-medium text-[#9b9a97]"> / {attempt.totalQuestions}</span></p></div>
          <button onClick={beginRetake} className="inline-flex items-center gap-2 rounded-lg border border-[#d9d5cd] bg-white px-4 py-2.5 text-sm font-medium text-[#37352f] transition hover:bg-[#f5f3ef]"><RotateCcw className="h-4 w-4" /> Retake</button>
        </div>
        <div className="mt-6 space-y-4">
          {presentedQuestionIds.map((questionId, index) => {
            const item = questionById.get(questionId)!;
            const answer = reviewAnswers.get(questionId);
            const optionOrder = jsonIdList(answer?.optionOrder);
            const reviewOptions = answer?.question.options ?? item.options;
            return <article key={questionId} className="rounded-2xl border border-[#e9e5dd] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${answer?.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{answer?.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wider text-[#a66324]">Question {index + 1}</p><h2 className="mt-1 text-base font-medium leading-relaxed text-[#37352f]">{item.prompt}</h2></div></div>
              <div className="mt-4 space-y-2 pl-9">
                {(optionOrder.length ? optionOrder : item.options.map((option) => option.id)).map((optionId) => {
                  const option = reviewOptions.find((entry) => entry.id === optionId);
                  if (!option) return null;
                  const correct = option.isCorrect;
                  const chosen = answer?.selectedOptionId === option.id;
                  return <div key={option.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : chosen ? "border-rose-200 bg-rose-50 text-rose-900" : "border-transparent bg-[#faf9f7] text-[#6b6964]"}`}>
                    <span className="mt-0.5 shrink-0">{correct ? <Check className="h-4 w-4" /> : chosen ? <X className="h-4 w-4" /> : null}</span><span>{option.text}{chosen && !correct && <span className="ml-1 text-xs">· Your answer</span>}</span>
                  </div>;
                })}
              </div>
              <div className="ml-9 mt-4 border-l-2 border-[#d9c5a7] pl-3"><p className="text-xs font-semibold text-[#8c5c2b]">Explanation</p><p className="mt-1 text-sm leading-relaxed text-[#62605b]">{item.explanation}</p></div>
            </article>;
          })}
        </div>
        <Link href="/dashboard/quiz" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#787774] hover:text-[#37352f]"><ArrowLeft className="h-4 w-4" /> All quizzes</Link>
      </div>}
    </>}
  </section>;
}
