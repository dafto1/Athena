"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CircleHelp, FileText, LoaderCircle, Plus, X } from "lucide-react";

type QuizRow = {
  id: string; title: string; createdAt: string;
  resource: { id: string; title: string };
  _count: { questions: number };
  attempts: { id: string; score: number; totalQuestions: number; createdAt: string }[];
};
type ResourceRow = { id: string; title: string; fileName: string; fileType: string };

export function QuizHome() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modal, setModal] = useState(false);
  const [resourceId, setResourceId] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/quizzes", { cache: "no-store" }).then(async (r) => { if (!r.ok) throw new Error("Could not load quizzes."); return r.json() as Promise<QuizRow[]>; }),
      fetch("/api/quizzes/resources", { cache: "no-store" }).then(async (r) => { if (!r.ok) throw new Error("Could not load resources."); return r.json() as Promise<ResourceRow[]>; }),
    ]).then(([quizRows, resourceRows]) => {
      if (!active) return;
      setQuizzes(quizRows); setResources(resourceRows); setResourceId(resourceRows[0]?.id ?? "");
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load quizzes."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function createQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resourceId) return;
    setCreating(true); setError("");
    try {
      const response = await fetch("/api/quizzes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceId, topic }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Quiz generation failed.");
      router.push(`/dashboard/quiz/${result.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Quiz generation failed.");
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-5 pb-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a66324]">Study</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#37352f]">Quiz</h1>
        </div>
        <button onClick={() => { setError(""); setModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#37352f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4a4842] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b77935]">
          <Plus className="h-4 w-4" /> New quiz
        </button>
      </div>

      {error && !modal && <p role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
      {loading ? <div className="flex justify-center py-24"><LoaderCircle className="h-6 w-6 animate-spin text-[#a66324]" aria-label="Loading quizzes" /></div> : quizzes.length ? (
        <div className="mt-8 divide-y divide-[#ebe9e4] border-y border-[#ebe9e4]">
          {quizzes.map((quiz) => {
            const latest = quiz.attempts[0];
            return <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`} className="group flex items-center gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b77935]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f5eee4] text-[#a66324]"><CircleHelp className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-[#37352f]">{quiz.title}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#787774]"><span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{quiz.resource.title}</span><span>{quiz._count.questions} questions</span></span>
              </span>
              <span className="flex items-center gap-3 text-right">
                {latest ? <span><span className="block text-sm font-semibold text-[#37352f]">{latest.score}/{latest.totalQuestions}</span><span className="text-xs text-[#787774]">Latest score</span></span> : <span className="text-xs text-[#787774]">Not attempted</span>}
                <ArrowRight className="h-4 w-4 text-[#a7a39b] transition group-hover:translate-x-0.5 group-hover:text-[#a66324]" />
              </span>
            </Link>;
          })}
        </div>
      ) : <div className="mt-12 rounded-2xl border border-dashed border-[#d9d5cd] px-6 py-16 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-[#a66324]" />
        <p className="mt-4 font-medium text-[#37352f]">No quizzes yet</p>
        <button onClick={() => setModal(true)} className="mt-5 text-sm font-medium text-[#a66324] underline-offset-4 hover:underline">Create your first quiz</button>
      </div>}

      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d1b18]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !creating) setModal(false); }}>
        <form onSubmit={createQuiz} className="w-full max-w-md rounded-2xl border border-[#e8e3da] bg-white p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-[#37352f]">New quiz</h2><button type="button" aria-label="Close" disabled={creating} onClick={() => setModal(false)} className="rounded-md p-1 text-[#787774] hover:bg-[#f5f3ef] disabled:opacity-50"><X className="h-4 w-4" /></button></div>
          {resources.length ? <>
            <label className="mt-5 block text-sm font-medium text-[#4a4842]" htmlFor="quiz-resource">Resource</label>
            <select id="quiz-resource" value={resourceId} onChange={(event) => setResourceId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#d9d5cd] bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none focus:border-[#a66324] focus:ring-2 focus:ring-[#a66324]/15">
              {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
            </select>
            <label className="mt-4 block text-sm font-medium text-[#4a4842]" htmlFor="quiz-topic">Focus <span className="font-normal text-[#98958e]">optional</span></label>
            <input id="quiz-topic" value={topic} maxLength={160} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. TCP client and server" className="mt-2 w-full rounded-lg border border-[#d9d5cd] bg-white px-3 py-2.5 text-sm text-[#37352f] outline-none placeholder:text-[#a7a39b] focus:border-[#a66324] focus:ring-2 focus:ring-[#a66324]/15" />
            {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={creating || !resourceId} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#37352f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4a4842] disabled:cursor-wait disabled:opacity-70">{creating && <LoaderCircle className="h-4 w-4 animate-spin" />}{creating ? "Generating…" : "Generate quiz"}</button>
          </> : <div className="pt-5"><p className="text-sm text-[#787774]">Upload a resource with readable text first.</p><Link href="/dashboard/resources" onClick={() => setModal(false)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#a66324]">Open resources <ArrowRight className="h-4 w-4" /></Link></div>}
        </form>
      </div>}
    </section>
  );
}
