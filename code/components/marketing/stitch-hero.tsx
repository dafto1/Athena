"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Timer,
  Edit3,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Check,
  FileText,
  Volume2,
  FolderOpen,
  Users,
  CheckCircle2,
  BookmarkCheck,
  Sparkles,
} from "lucide-react";

interface TaskItem {
  id: string;
  text: string;
  tag: string;
  tagBg: string;
  subtext: string;
  completed: boolean;
}

const initialTasks: TaskItem[] = [
  {
    id: "1",
    text: "Read Atkinson & Shiffrin Review (pp. 38–54)",
    tag: "Cognitive Psych",
    tagBg: "bg-[#EEE0BA] text-[#292825]",
    subtext: "Finished 9:30 AM",
    completed: true,
  },
  {
    id: "2",
    text: "Draft Problem Set 4 — IS-LM Shocks",
    tag: "Macroeconomics 201",
    tagBg: "bg-[#E8E6E0] text-[#292825]",
    subtext: "Due 6:00 PM today",
    completed: false,
  },
  {
    id: "3",
    text: "Annotate Kahneman Ch. 3 (Heuristics & Biases)",
    tag: "Cognitive Psych",
    tagBg: "bg-[#EEE0BA] text-[#292825]",
    subtext: "35 min session",
    completed: false,
  },
];

export function StitchHero() {
  const [activeTab, setActiveTab] = useState<"focus" | "pdf" | "syllabus">("focus");
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundscape, setSoundscape] = useState("Archival Library");

  // Pomodoro countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, pomodoroSeconds]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPomodoroSeconds(25 * 60);
  };

  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  // Staggered text & frame reveal on load (inspired by tanishbhavsar.vercel.app)
  useGSAP(
    () => {
      const el = heroRef.current;
      if (!el) return;

      const titleLines = el.querySelectorAll(".hero-title-line");
      const sub = el.querySelector(".hero-subtitle");
      const cta = el.querySelector(".hero-cta");
      const frame = el.querySelector(".hero-frame");

      if (reduceMotion) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (titleLines.length) {
        tl.fromTo(
          titleLines,
          { yPercent: 115, opacity: 0, filter: "blur(12px)" },
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.1,
            stagger: 0.12,
          },
          0.1
        );
      }

      if (sub) {
        tl.fromTo(
          sub,
          { y: 22, opacity: 0, filter: "blur(8px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9 },
          0.45
        );
      }

      if (cta) {
        tl.fromTo(
          cta,
          { y: 14, opacity: 0, scale: 0.985 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8 },
          0.65
        );
      }

      if (frame) {
        tl.fromTo(
          frame,
          { y: 30, opacity: 0, scale: 0.985, rotateX: 0.8, transformPerspective: 1000 },
          { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.25, ease: "power3.out" },
          0.5
        );
      }
    },
    { scope: heroRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={heroRef}
      className="w-full px-6 lg:px-12 pb-20 max-w-7xl mx-auto flex flex-col items-center pt-28 relative"
    >
      {/* Background stipple texture */}
      <div className="absolute inset-0 bg-grid-notebook pointer-events-none opacity-40 -z-10" />
      <div className="absolute top-16 right-10 w-80 h-80 bg-[#EEE0BA]/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-96 h-96 bg-[#E8E6E0]/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Pitch with Masked Line Reveals */}
      <div className="max-w-4xl text-center flex flex-col items-center">
        <h1 className="font-serif-stitch text-4xl sm:text-5xl md:text-[62px] md:leading-[68px] text-[#292825] tracking-tight font-medium text-balance italic">
          <div className="overflow-hidden pb-1">
            <span className="hero-title-line inline-block will-change-transform">
              Calm, structured focus
            </span>
          </div>
          <div className="overflow-hidden">
            <span className="hero-title-line inline-block not-italic font-semibold font-space-stitch text-[#292825] tracking-tight will-change-transform">
              for serious scholarship.
            </span>
          </div>
        </h1>
        <p className="hero-subtitle mt-5 font-space-stitch text-base md:text-lg text-[#77756F] max-w-2xl leading-relaxed text-balance will-change-transform">
          Timers, course readings, and peer study rooms—unified in one distraction-free workspace.
        </p>

        {/* Action Button */}
        <div className="hero-cta mt-8 flex items-center justify-center will-change-transform">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#292825] hover:bg-[#1c1b19] text-white font-mono-stitch text-xs font-semibold rounded transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group hover:ring-1 hover:ring-[#E2B85C]/60"
          >
            <span>Get started free</span>
            <ArrowRight className="w-4 h-4 text-[#E2B85C] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Realistic Tactile App Workspace Frame */}
      <div className="hero-frame mt-12 w-full max-w-6xl rounded-lg bg-white border border-[#E8E6E0] shadow-[0_16px_40px_rgba(41,40,37,0.08)] overflow-hidden relative will-change-transform">
        {/* Workspace Top Bar */}
        <div className="h-11 bg-[#F5F4F0] px-4 flex items-center justify-between border-b border-[#E8E6E0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#D48D85] border border-black/10" />
              <div className="w-3 h-3 rounded-full bg-[#E2B85C] border border-black/10" />
              <div className="w-3 h-3 rounded-full bg-[#95B292] border border-black/10" />
            </div>
            <span className="hidden sm:inline-block ml-3 font-mono-stitch text-[11px] text-[#77756F]/80">
              Athena OS — Elena’s Notebook (Term 2)
            </span>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded border border-[#E8E6E0]">
            <button
              onClick={() => setActiveTab("focus")}
              className={`px-3 py-1 rounded text-xs font-mono-stitch font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "focus"
                  ? "bg-white text-[#292825] shadow-xs font-semibold"
                  : "text-[#77756F] hover:text-[#292825]"
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-[#E2B85C]" />
              <span>Daily Focus Board</span>
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`px-3 py-1 rounded text-xs font-mono-stitch font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "pdf"
                  ? "bg-white text-[#292825] shadow-xs font-semibold"
                  : "text-[#77756F] hover:text-[#292825]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>PDF Annotator</span>
            </button>
            <button
              onClick={() => setActiveTab("syllabus")}
              className={`px-3 py-1 rounded text-xs font-mono-stitch font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "syllabus"
                  ? "bg-white text-[#292825] shadow-xs font-semibold"
                  : "text-[#77756F] hover:text-[#292825]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Syllabus Matrix</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[#77756F] text-xs">
            <span className="flex items-center gap-1.5 text-[#576055] font-medium font-mono-stitch">
              <span className="w-1.5 h-1.5 rounded-full bg-[#576055]" /> Cloud Synced
            </span>
          </div>
        </div>

        {/* TAB 1: DAILY FOCUS BOARD */}
        {activeTab === "focus" && (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
            {/* Binder Sidebar (3 cols) */}
            <div className="hidden md:flex md:col-span-3 bg-[#F5F4F0] p-4 flex-col justify-between border-r border-[#E8E6E0]">
              <div className="space-y-5">
                {/* Profile */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#E8E6E0]">
                  <div className="w-9 h-9 rounded-full bg-[#EEE0BA] text-[#292825] flex items-center justify-center font-bold text-xs border border-[#E2B85C]/40">
                    EL
                  </div>
                  <div className="leading-tight">
                    <p className="font-mono-stitch text-xs font-semibold text-[#292825]">
                      Elena Rostova
                    </p>
                    <p className="font-space-stitch text-[11px] text-[#77756F]">
                      Cognitive Science & Econ
                    </p>
                  </div>
                </div>

                {/* Views List */}
                <div>
                  <p className="font-mono-stitch text-[10px] uppercase tracking-wider text-[#77756F] mb-2 font-semibold">
                    Active Views
                  </p>
                  <ul className="space-y-1 font-space-stitch text-xs">
                    <li className="flex items-center gap-2.5 px-2.5 py-1.5 rounded bg-white text-[#292825] font-semibold shadow-xs border border-[#E8E6E0]">
                      <Calendar className="w-4 h-4 text-[#E2B85C]" />
                      <span>Today&apos;s Plan</span>
                      <span className="ml-auto font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-1.5 py-0.5 rounded font-bold border border-[#E2B85C]/30">
                        {tasks.length - completedCount} due
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer transition-colors">
                      <Timer className="w-4 h-4" />
                      <span>Focus Analytics</span>
                    </li>
                    <li className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer transition-colors">
                      <FolderOpen className="w-4 h-4" />
                      <span>Course Binders</span>
                    </li>
                    <li className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer transition-colors">
                      <Users className="w-4 h-4 text-[#576055]" />
                      <span>Bio 204 Cohort</span>
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#576055]" />
                    </li>
                  </ul>
                </div>

                {/* Courses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono-stitch text-[10px] uppercase tracking-wider text-[#77756F] font-semibold">
                      Course Binders
                    </p>
                  </div>
                  <ul className="space-y-1 font-space-stitch text-xs">
                    <li className="flex items-center gap-2 px-2.5 py-1 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-[#E2B85C]" />
                      <span className="truncate">Cognitive Psychology</span>
                    </li>
                    <li className="flex items-center gap-2 px-2.5 py-1 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-[#576055]" />
                      <span className="truncate">Macroeconomics 201</span>
                    </li>
                    <li className="flex items-center gap-2 px-2.5 py-1 rounded text-[#77756F] hover:bg-white hover:text-[#292825] cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-[#292825]" />
                      <span className="truncate">Organic Chemistry I</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vault Storage */}
              <div className="pt-3 border-t border-[#E8E6E0] text-[11px] text-[#77756F]">
                <div className="flex justify-between font-mono-stitch mb-1">
                  <span>Vault Storage</span>
                  <span>1.8 / 5.0 GB</span>
                </div>
                <div className="w-full bg-[#E8E6E0] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#292825] h-full rounded-full" style={{ width: "36%" }} />
                </div>
              </div>
            </div>

            {/* Main Interactive Canvas (9 cols) */}
            <div className="col-span-1 md:col-span-9 bg-[#FAF9F6] p-6 flex flex-col gap-6">
              {/* Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E6E0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-stitch text-[11px] text-[#B85D38] font-bold uppercase tracking-wider">
                      Wednesday, October 16
                    </span>
                    <span className="text-[#E8E6E0] text-xs">•</span>
                    <span className="text-xs text-[#77756F] font-medium font-space-stitch">
                      Midterm Week 7
                    </span>
                  </div>
                  <h2 className="font-serif-stitch text-xl md:text-2xl text-[#292825] font-semibold mt-0.5">
                    Good morning, Elena. 2 deep work blocks scheduled.
                  </h2>
                </div>
              </div>

              {/* Tasks & Pomodoro Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Task List (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white p-4 rounded border border-[#E8E6E0] shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono-stitch text-xs font-bold text-[#292825] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#E2B85C]" />
                        Today&apos;s Focus Priorities
                      </span>
                      <span className="font-mono-stitch text-[11px] text-[#77756F] font-medium">
                        {completedCount} of {tasks.length} completed
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="flex items-start gap-3 p-2.5 rounded bg-[#FAF9F6] hover:bg-[#F5F4F0] transition-colors border border-[#E8E6E0] cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 rounded text-[#292825] accent-[#292825] cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-space-stitch text-xs font-medium truncate ${
                                task.completed
                                  ? "line-through text-[#77756F]"
                                  : "text-[#292825]"
                              }`}
                            >
                              {task.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`font-mono-stitch text-[10px] px-1.5 py-0.5 rounded font-medium ${task.tagBg}`}
                              >
                                {task.tag}
                              </span>
                              <span className="font-mono-stitch text-[11px] text-[#77756F] flex items-center gap-0.5">
                                {task.completed && (
                                  <Check className="w-3 h-3 text-[#576055]" />
                                )}
                                {task.subtext}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone Alert */}
                  <div className="bg-[#F5F4F0] p-3.5 rounded border border-[#E8E6E0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-[#EEE0BA] text-[#292825] flex items-center justify-center flex-shrink-0">
                        <BookmarkCheck className="w-5 h-5 text-[#B85D38]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-1.5 py-0.2 rounded font-bold uppercase">
                            Major Milestone
                          </span>
                          <span className="font-mono-stitch text-[11px] text-[#77756F]">
                            Exam in 4 days
                          </span>
                        </div>
                        <p className="font-space-stitch text-xs font-semibold text-[#292825] mt-0.5">
                          Cognitive Psychology Midterm Synthesis Paper
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("syllabus")}
                      className="px-2.5 py-1 text-xs font-mono-stitch font-semibold bg-white border border-[#E8E6E0] rounded hover:bg-[#FAF9F6] transition-colors shadow-2xs"
                    >
                      Open Brief
                    </button>
                  </div>
                </div>

                {/* Pomodoro Widget (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-white p-5 rounded border border-[#E8E6E0] shadow-sm flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[#77756F] font-mono-stitch text-xs mb-2">
                      <span className="flex items-center gap-1.5 text-[#576055] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#576055] animate-pulse" />
                        <span>Deep Focus Mode</span>
                      </span>
                      <span>Session 3/4</span>
                    </div>

                    <div className="my-2 text-center">
                      <div className="font-serif-stitch text-[52px] leading-none tracking-tight font-bold text-[#292825] font-mono tabular-nums select-none">
                        {formatTimer(pomodoroSeconds)}
                      </div>
                      <p className="font-mono-stitch text-xs text-[#77756F] mt-2">
                        Target: <span className="text-[#292825] font-semibold">Cognitive Psychology</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={resetTimer}
                        className="w-9 h-9 rounded-full bg-[#F5F4F0] hover:bg-[#E8E6E0] flex items-center justify-center text-[#292825] border border-[#E8E6E0] transition-colors"
                        title="Reset Session"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="px-6 py-2.5 bg-[#292825] hover:bg-[#1c1b19] text-white rounded font-mono-stitch text-xs font-semibold flex items-center gap-2 shadow-sm transition-all transform active:scale-95"
                      >
                        {isRunning ? (
                          <>
                            <Pause className="w-4 h-4 text-[#E2B85C]" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 text-[#E2B85C]" />
                            <span>Start Focus</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setPomodoroSeconds(5 * 60)}
                        className="w-9 h-9 rounded-full bg-[#F5F4F0] hover:bg-[#E8E6E0] flex items-center justify-center text-[#292825] border border-[#E8E6E0] transition-colors"
                        title="Next Interval"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Soundscape Visualizer */}
                    <div className="mt-5 pt-3 border-t border-[#E8E6E0] w-full flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-end gap-0.5 h-4 opacity-75">
                          <div className={`w-1 bg-[#576055] rounded-full ${isRunning ? "wave-bar-1" : "h-1"}`} />
                          <div className={`w-1 bg-[#576055] rounded-full ${isRunning ? "wave-bar-2" : "h-2"}`} />
                          <div className={`w-1 bg-[#576055] rounded-full ${isRunning ? "wave-bar-3" : "h-1.5"}`} />
                          <div className={`w-1 bg-[#576055] rounded-full ${isRunning ? "wave-bar-4" : "h-3"}`} />
                        </div>
                        <span className="font-space-stitch text-[11px] text-[#292825] font-medium">
                          {soundscape}
                        </span>
                      </div>
                      <select
                        value={soundscape}
                        onChange={(e) => setSoundscape(e.target.value)}
                        className="text-[11px] bg-[#F5F4F0] border border-[#E8E6E0] rounded px-2 py-0.5 text-[#292825] font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="Archival Library">Archival Library</option>
                        <option value="Rain on Glass">Rain on Glass</option>
                        <option value="Greenhouse Lo-fi">Greenhouse Lo-fi</option>
                        <option value="Silent Study">Mute Soundscape</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Document Card */}
                  <div
                    onClick={() => setActiveTab("pdf")}
                    className="bg-white p-3 rounded border border-[#E8E6E0] text-xs cursor-pointer hover:bg-[#FAF9F6] transition-colors"
                  >
                    <span className="font-mono-stitch text-[10px] uppercase font-bold tracking-wider text-[#77756F]">
                      Active Document In Session
                    </span>
                    <div className="flex items-center justify-between mt-1.5 p-1.5 rounded bg-[#FAF9F6]">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-[#B85D38]" />
                        <span className="font-medium truncate text-[#292825]">
                          Cognitive_Psychology_Midterm_Notes.pdf
                        </span>
                      </div>
                      <span className="font-mono-stitch text-[10px] text-[#292825] flex items-center gap-0.5 font-semibold">
                        Annotate <ArrowRight className="w-3 h-3 text-[#E2B85C]" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PDF SPLIT ANNOTATOR */}
        {activeTab === "pdf" && (
          <div className="min-h-[560px] bg-white p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0] mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono-stitch text-xs bg-[#EEE0BA] text-[#292825] px-2 py-0.5 rounded font-bold border border-[#E2B85C]/40">
                  PDF Reader & Split Notebook
                </span>
                <span className="text-sm font-semibold text-[#292825]">
                  Atkinson & Shiffrin (1968) Human Memory Review.pdf
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono-stitch text-xs text-[#77756F]">
                <span>Page 42 of 68</span>
                <button
                  onClick={() => setActiveTab("focus")}
                  className="px-2.5 py-1 rounded bg-[#F5F4F0] hover:bg-[#E8E6E0] border border-[#E8E6E0] text-[#292825]"
                >
                  Return to Focus
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[460px]">
              {/* Left PDF Column */}
              <div className="md:col-span-7 bg-[#FAF9F6] p-6 rounded border border-[#E8E6E0] font-serif-stitch text-sm text-[#292825] leading-relaxed overflow-y-auto space-y-4">
                <p className="font-space-stitch font-bold text-base text-[#292825] not-italic">
                  Section 2.3: Structural Transfer Mechanisms
                </p>
                <p>
                  &ldquo;The memory trace is initially accepted into the{" "}
                  <span className="bg-[#EEE0BA] px-1 py-0.5 rounded font-medium border-b border-[#E2B85C]">
                    sensory buffer register
                  </span>
                  , where environmental sensory qualities are maintained for brief intervals before rapid autonomic decay occurs.&rdquo;
                </p>
                <div className="p-3 bg-[#F5F4F0] rounded border-l-2 border-[#E2B85C] not-italic font-space-stitch text-xs">
                  <span className="font-bold text-[#292825] block mb-0.5 font-mono-stitch uppercase text-[10px]">
                    Elena’s Highlight Note:
                  </span>
                  &ldquo;Crucial mechanism for Midterm Question 3: Selective attention acts as the gate between sensory decay and the STS.&rdquo;
                </div>
                <p>
                  &ldquo;Information that is attended to is recoded and directed to the{" "}
                  <span className="bg-[#E6EAE5] px-1 py-0.5 rounded font-medium border-b border-[#576055]">
                    Short-Term Store (STS)
                  </span>
                  . Here, rehearsal mechanisms determine whether traces undergo cognitive rehearsal or decay within 15 to 30 seconds.&rdquo;
                </p>
              </div>

              {/* Right Margin Synthesis Notes */}
              <div className="md:col-span-5 bg-[#F5F4F0] p-5 rounded border border-[#E8E6E0] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono-stitch text-xs font-bold text-[#292825] uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-[#E2B85C]" />
                      Margin Synthesis Notes
                    </span>
                    <span className="font-mono-stitch text-[10px] text-[#576055] font-medium">
                      Auto-saved 2s ago
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border border-[#E8E6E0] text-xs font-space-stitch space-y-2">
                    <p className="font-bold text-[#292825]">3 Core Storage Tenets to Memorize:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[#77756F]">
                      <li>Sensory buffer = extremely brief (decay &lt; 1s)</li>
                      <li>STS = active rehearsal window (15–30s)</li>
                      <li>LTS = unlimited capacity; accessed via retrieval cues</li>
                    </ul>
                    <div className="mt-3 pt-2 border-t border-[#E8E6E0] text-[11px] text-[#292825] font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E2B85C]" />
                      <span>Generate 3 retrieval flashcards on STS vs LTS</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("focus")}
                  className="w-full py-2 bg-[#292825] text-white text-xs font-semibold rounded hover:bg-[#1c1b19] transition-colors shadow-sm font-space-stitch"
                >
                  Save Annotation & Resume Study Block
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYLLABUS CALENDAR MATRIX */}
        {activeTab === "syllabus" && (
          <div className="min-h-[560px] bg-white p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0] mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono-stitch text-xs bg-[#EEE0BA] text-[#292825] px-2 py-0.5 rounded font-bold border border-[#E2B85C]/40">
                  Automated Syllabus Matrix
                </span>
                <span className="text-sm font-semibold text-[#292825]">
                  Semester Timeline — Week 7 of 16
                </span>
              </div>
              <button
                onClick={() => setActiveTab("focus")}
                className="text-xs px-2.5 py-1 rounded bg-[#F5F4F0] hover:bg-[#E8E6E0] border border-[#E8E6E0] font-mono-stitch"
              >
                Return to Workspace
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-[#E2B85C]/50 bg-[#EEE0BA]/20">
                <span className="font-mono-stitch text-[10px] font-bold uppercase tracking-wider text-[#292825]">
                  This Week (High Urgency)
                </span>
                <p className="font-serif-stitch text-base font-semibold text-[#292825] mt-1">
                  Cognitive Psychology Midterm
                </p>
                <p className="text-xs text-[#77756F] mt-1 font-space-stitch">
                  Covers Chapters 1–4. 40% synthesis essay on storage architectures.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E2B85C]/30 flex justify-between text-[11px] font-medium text-[#292825] font-mono-stitch">
                  <span>Due in 4 days</span>
                  <span className="underline cursor-pointer">Open syllabus unit</span>
                </div>
              </div>

              <div className="p-4 rounded border border-[#E8E6E0] bg-white">
                <span className="font-mono-stitch text-[10px] font-bold uppercase tracking-wider text-[#576055]">
                  Next Week
                </span>
                <p className="font-serif-stitch text-base font-semibold text-[#292825] mt-1">
                  Macroeconomics Problem Set 5
                </p>
                <p className="text-xs text-[#77756F] mt-1 font-space-stitch">
                  Monetary transmission mechanism & Phillips curve shifts.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E8E6E0] flex justify-between text-[11px] font-medium text-[#77756F] font-mono-stitch">
                  <span>Due Oct 24</span>
                  <span className="hover:text-[#292825] cursor-pointer">View requirements</span>
                </div>
              </div>

              <div className="p-4 rounded border border-[#E8E6E0] bg-white">
                <span className="font-mono-stitch text-[10px] font-bold uppercase tracking-wider text-[#77756F]">
                  Week 9
                </span>
                <p className="font-serif-stitch text-base font-semibold text-[#292825] mt-1">
                  Bio 204 Lab Report II
                </p>
                <p className="text-xs text-[#77756F] mt-1 font-space-stitch">
                  Cellular respiration spectrophotometry results and writeup.
                </p>
                <div className="mt-3 pt-2 border-t border-[#E8E6E0] flex justify-between text-[11px] font-medium text-[#77756F] font-mono-stitch">
                  <span>Due Nov 02</span>
                  <span className="hover:text-[#292825] cursor-pointer">Team assignment</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
