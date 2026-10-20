"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minimize2, Pause, Play, Timer, X } from "lucide-react";
import { useTimer } from "./use-timer";
export function FloatingFocusTimer() {
  const timer = useTimer(25); const [visible, setVisible] = useState(false); const [minimized, setMinimized] = useState(false); const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle"); const saveFired = useRef(false);
  const saveSession = useCallback(async (durationMin = timer.durationMin) => {
    if (!timer.startedAt) return;
    setSaveState("saving");
    try {
      const response = await fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationMin, startedAt: timer.startedAt }) });
      if (!response.ok) throw new Error("Session save failed");
      setSaveState("saved");
      window.dispatchEvent(new Event("study-session-saved"));
    } catch {
      setSaveState("error");
    }
  }, [timer.durationMin, timer.startedAt]);
  useEffect(() => {
    if (timer.status !== "completed" || saveFired.current || !timer.startedAt) return;
    saveFired.current = true;
    setSaveState("saving");
    void saveSession();
  }, [saveSession, timer.startedAt, timer.status]);
  useEffect(() => { const start = (event: Event) => { const minutes = (event as CustomEvent<number>).detail; saveFired.current = false; setSaveState("idle"); timer.start(minutes); setVisible(true); setMinimized(false); }; window.addEventListener("nemo:start-focus", start); return () => window.removeEventListener("nemo:start-focus", start); }, [timer]);
  function resetTimer() { saveFired.current = false; setSaveState("idle"); timer.reset(); }
  function closeTimer() {
    if (timer.status === "completed") {
      setVisible(false);
      return;
    }
    const elapsedMinutes = Math.floor((timer.totalSeconds - timer.secondsLeft) / 60);
    if (timer.startedAt && elapsedMinutes > 0 && !saveFired.current) {
      saveFired.current = true;
      void saveSession(elapsedMinutes);
    }
    timer.reset();
    setVisible(false);
  }
  if (!visible) return null; const value = `${String(Math.floor(timer.secondsLeft / 60)).padStart(2, "0")}:${String(timer.secondsLeft % 60).padStart(2, "0")}`;
  return <aside aria-label="Floating focus timer" className={`fixed bottom-5 right-5 z-50 overflow-hidden rounded-2xl border border-[#d8d1c6] bg-[#292825] text-white shadow-2xl transition-all ${minimized ? "w-48" : "w-72"}`}>
    <div className="flex items-center justify-between px-4 py-3"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#e7c79d]"><Timer className="h-3.5 w-3.5" />Focus</span><div className="flex gap-1"><button type="button" onClick={() => setMinimized(!minimized)} aria-label="Minimize timer" className="rounded p-1 text-stone-300 hover:bg-white/10"><Minimize2 className="h-4 w-4" /></button><button type="button" onClick={closeTimer} aria-label="Close timer" className="rounded p-1 text-stone-300 hover:bg-white/10"><X className="h-4 w-4" /></button></div></div>
    {!minimized && <div className="border-t border-white/10 px-4 pb-4 pt-3"><p className="font-mono-stitch text-5xl font-medium tracking-[-0.08em]">{value}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => timer.status === "running" ? timer.pause() : timer.start()} disabled={timer.status === "completed"} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#e7c79d] px-3 py-2 text-xs font-bold text-[#292825] disabled:opacity-50">{timer.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{timer.status === "running" ? "Pause" : "Resume"}</button><button type="button" onClick={resetTimer} className="rounded-lg border border-white/20 px-3 text-xs text-stone-200">Reset</button></div>{saveState !== "idle" && <p aria-live="polite" className="mt-3 text-xs text-stone-300">{saveState === "saving" ? "Saving session to your account…" : saveState === "saved" ? "Session saved to your history." : <>Couldn’t save this session. <button type="button" onClick={() => void saveSession()} className="underline underline-offset-2">Try again</button></>}</p>}</div>}
  </aside>;
}
