"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useReducedMotion } from "motion/react";
import {
  CheckSquare,
  Clock,
  FileText,
  Users,
  CalendarDays,
  Sparkles,
  Check,
  Flame,
  Search,
  ArrowRight,
  Share2,
} from "lucide-react";

// Register GSAP plugins safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface FeatureItem {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  color: string;
  icon: typeof CheckSquare;
}

const features: FeatureItem[] = [
  {
    id: "task-management",
    number: "01",
    title: "Task Management",
    tagline: "Keep the next important thing clear.",
    description:
      "Track assignments, set deadlines, prioritize by urgency. A simple task board that works the way you think.",
    color: "#e8705a",
    icon: CheckSquare,
  },
  {
    id: "focus-timer",
    number: "02",
    title: "Focus Timer",
    tagline: "One thing at a time.",
    description:
      "Pomodoro sessions with history tracking. Start a timer, do the work, see your streak grow.",
    color: "#d4a853",
    icon: Clock,
  },
  {
    id: "resource-library",
    number: "03",
    title: "Resource Library",
    tagline: "Your course files, always findable.",
    description:
      "Upload PDFs, lecture notes, and assignments. Categorize, search, and annotate — all in one place.",
    color: "#8b6cc1",
    icon: FileText,
  },
  {
    id: "study-groups",
    number: "04",
    title: "Study Groups",
    tagline: "Learn better together.",
    description:
      "Create groups, share resources across folders, and collaborate with classmates on course materials.",
    color: "#5ea67f",
    icon: Users,
  },
  {
    id: "calendar-sync",
    number: "05",
    title: "Calendar Sync",
    tagline: "Your schedule, unified.",
    description:
      "Connect Google Calendar or Outlook. See academic events alongside your tasks and deadlines.",
    color: "#5b8dd9",
    icon: CalendarDays,
  },
  {
    id: "nemo-ai",
    number: "06",
    title: "Nemo AI",
    tagline: "Your AI study companion.",
    description:
      "Ask questions, get explanations, generate summaries. An AI tutor that understands your context.",
    color: "#d4689c",
    icon: Sparkles,
  },
];

export interface FeaturesHorizontalProps {
  className?: string;
}

export function FeaturesHorizontal({ className = "" }: FeaturesHorizontalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      // Respect prefers-reduced-motion
      if (reduceMotion) return;

      const mm = gsap.matchMedia();

      // Only enable horizontal pin and scroll on screens >= 768px (tablets & desktop)
      mm.add("(min-width: 768px)", () => {
        const container = containerRef.current;
        const track = trackRef.current;
        if (!container || !track) return;

        const totalCards = features.length;
        const cardWidth = 400;
        // Scroll distance equals (number of cards * card width) as required
        const scrollDistance = totalCards * cardWidth;

        // Calculate maximum track travel distance
        const getScrollAmount = () => {
          return track.scrollWidth - container.clientWidth;
        };

        // Horizontal track tween driven by vertical scroll
        const horizontalTween = gsap.to(track, {
          x: () => -Math.max(0, getScrollAmount()),
          ease: "none",
          scrollTrigger: {
            trigger: container,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${scrollDistance}`,
            invalidateOnRefresh: true,
          },
        });

        // Each card scales up and fades in as it comes into view
        cardsRef.current.forEach((card, i) => {
          if (!card) return;

          if (i === 0) {
            // First card starts fully visible as user reaches the pinned section
            gsap.fromTo(
              card,
              { scale: 0.96, opacity: 0.85 },
              {
                scale: 1,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: container,
                  start: "top 75%",
                  end: "top top",
                  scrub: true,
                },
              }
            );
          } else {
            // Successive cards scale up and fade in as they travel horizontally into view
            gsap.fromTo(
              card,
              {
                scale: 0.9,
                opacity: 0.55,
              },
              {
                scale: 1,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: horizontalTween,
                  start: "left 95%",
                  end: "left 65%",
                  scrub: true,
                },
              }
            );
          }
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={containerRef}
      className={`relative w-full min-h-screen md:h-screen overflow-visible md:overflow-hidden bg-[#faf9f6] dark:bg-[#171717] transition-colors py-12 md:py-0 flex flex-col justify-center ${className}`}
      id="features-horizontal"
    >
      {/* Section Header */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#d4a853]" />
              <span className="text-[11px] font-semibold tracking-widest text-[#787774] dark:text-[#a8a29e] uppercase">
                Student Workspace
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#292825] dark:text-[#f5f4f0]">
              Everything you need
            </h2>
            <p className="mt-2 text-base md:text-lg text-[#787774] dark:text-[#a8a29e] max-w-xl">
              Each tool designed for how students actually study.
            </p>
          </div>

          {/* Desktop horizontal scroll prompt */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#787774] dark:text-[#a8a29e]">
            <span>Scroll to explore tools</span>
            <ArrowRight className="w-3.5 h-3.5 animate-pulse text-[#d4a853]" />
          </div>
        </motion.div>
      </div>

      {/* Horizontal Cards Track (Desktop) / Vertical Stacked Layout (Mobile) */}
      <div className="w-full overflow-visible">
        <div
          ref={trackRef}
          className="flex flex-col md:flex-row md:flex-nowrap gap-6 md:gap-8 items-stretch md:items-center px-6 md:pl-12 lg:pl-16 md:pr-16 w-full md:w-max will-change-transform"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="relative group w-full max-w-[420px] mx-auto md:mx-0 md:w-[400px] md:min-w-[400px] shrink-0 h-auto md:h-[500px] rounded-[12px] bg-white dark:bg-[#20201e] border border-[#e9e8e4] dark:border-[#383734] border-t-[3px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-none p-6 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300"
                style={{
                  borderTopColor: feature.color,
                }}
              >
                {/* Subtle top ambient tint */}
                <div
                  className="absolute top-0 inset-x-0 h-20 pointer-events-none opacity-40 dark:opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at top, ${feature.color}33 0%, transparent 75%)`,
                  }}
                />

                {/* Top section: Icon, Tagline, Description */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    {/* Large icon with colored circular background */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${feature.color}18`,
                      }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: feature.color }}
                        strokeWidth={2.2}
                      />
                    </div>
                    {/* Index badge */}
                    <span
                      className="text-xs font-semibold tracking-wider font-mono px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${feature.color}12`,
                        color: feature.color,
                      }}
                    >
                      {feature.number}
                    </span>
                  </div>

                  {/* Feature Title / Category */}
                  <div
                    className="text-[11px] font-bold tracking-wider uppercase mb-1.5"
                    style={{ color: feature.color }}
                  >
                    {feature.title}
                  </div>

                  {/* Tagline in bold, large text */}
                  <h3 className="text-xl sm:text-[22px] font-bold text-[#292825] dark:text-[#f5f4f0] tracking-tight leading-snug">
                    {feature.tagline}
                  </h3>

                  {/* Description in muted smaller text */}
                  <p className="mt-2 text-xs sm:text-[13px] text-[#787774] dark:text-[#a8a29e] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom section: Unique decorative element per feature */}
                <div className="relative z-10 mt-6 pt-4 border-t border-[#f0efeb] dark:border-[#2d2d2a]">
                  {/* Card 1: Task Management */}
                  {feature.id === "task-management" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#787774] dark:text-[#a8a29e] pb-1 border-b border-[#f0efeb] dark:border-[#333330]">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-[#e8705a]" />
                          <span>Today's Task Board</span>
                        </span>
                        <span className="text-[10px] bg-[#e8705a]/10 text-[#e8705a] px-1.5 py-0.5 rounded font-mono">
                          Urgent first
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#9c9991] dark:text-[#787774] line-through">
                        <div className="w-3.5 h-3.5 rounded bg-[#e8705a] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="truncate">Submit CS 301 Problem Set</span>
                        <span className="ml-auto text-[9px] text-[#9c9991] font-mono shrink-0">Done</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#292825] dark:text-[#e7e5e4] font-medium">
                        <div className="w-3.5 h-3.5 rounded border border-[#e8705a] shrink-0" />
                        <span className="truncate">Read Ch. 4: Operating Systems</span>
                        <span className="ml-auto text-[9px] bg-[#e8705a]/15 text-[#e8705a] px-1.5 py-0.5 rounded font-mono shrink-0">
                          Today 11:59p
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#5f5e5b] dark:text-[#c4c2be]">
                        <div className="w-3.5 h-3.5 rounded border border-[#d2cfc6] dark:border-[#4d4a44] shrink-0" />
                        <span className="truncate">Prepare lab presentation slides</span>
                        <span className="ml-auto text-[9px] text-[#8a8880] font-mono shrink-0">Tomorrow</span>
                      </div>
                    </div>
                  )}

                  {/* Card 2: Focus Timer */}
                  {feature.id === "focus-timer" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] flex flex-col items-center">
                      <div className="flex items-center justify-between w-full text-[11px] font-medium text-[#787774] dark:text-[#a8a29e] mb-2 pb-1 border-b border-[#f0efeb] dark:border-[#333330]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#d4a853]" />
                          <span>Deep Work Session</span>
                        </span>
                        <span className="text-[10px] bg-[#d4a853]/15 text-[#d4a853] px-1.5 py-0.5 rounded font-mono">
                          25m focus
                        </span>
                      </div>

                      <div className="relative my-1 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full border-4 border-[#eae8e2] dark:border-[#383734] border-t-[#d4a853] border-r-[#d4a853] flex flex-col items-center justify-center">
                          <span className="text-xl font-mono font-bold tracking-tight text-[#292825] dark:text-[#f5f4f0]">
                            24:18
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[#8a8880]">Active</span>
                        </div>
                      </div>

                      <div className="w-full mt-2 pt-2 border-t border-[#f0efeb] dark:border-[#333330] flex items-center justify-between text-[10px] text-[#787774] dark:text-[#a8a29e]">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#d4a853]" />
                          <span className="w-2 h-2 rounded-full bg-[#d4a853]" />
                          <span className="w-2 h-2 rounded-full bg-[#d4a853]" />
                          <span className="w-2 h-2 rounded-full border border-[#d4a853]" />
                          <span className="ml-1 text-[9px] font-mono">3/4</span>
                        </div>
                        <span className="flex items-center gap-1 text-[#d4a853] font-medium font-mono">
                          <Flame className="w-3 h-3 fill-current" /> 4 streak
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card 3: Resource Library */}
                  {feature.id === "resource-library" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] space-y-2 text-xs">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-[#1f1f1d] rounded border border-[#e4e2dc] dark:border-[#3a3936] text-[11px] text-[#8a8880]">
                        <Search className="w-3 h-3 text-[#8b6cc1]" />
                        <span className="truncate">Search course files, notes...</span>
                        <kbd className="ml-auto text-[9px] bg-[#f0efeb] dark:bg-[#2b2b28] px-1 rounded font-mono text-[#787774]">⌘K</kbd>
                      </div>

                      <div className="flex items-center gap-2 p-1.5 rounded bg-white/70 dark:bg-[#1f1f1d]/70 border border-[#eae8e2] dark:border-[#333330]">
                        <div className="w-7 h-7 rounded bg-[#8b6cc1]/15 text-[#8b6cc1] flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">
                          PDF
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#292825] dark:text-[#e7e5e4] truncate">
                            Algorithms_Lecture_08.pdf
                          </p>
                          <p className="text-[9px] text-[#8a8880]">42 pages · Annotated</p>
                        </div>
                        <span className="text-[9px] bg-[#8b6cc1]/10 text-[#8b6cc1] px-1.5 py-0.5 rounded font-mono shrink-0">
                          CS 301
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-1.5 rounded bg-white/70 dark:bg-[#1f1f1d]/70 border border-[#eae8e2] dark:border-[#333330]">
                        <div className="w-7 h-7 rounded bg-[#8b6cc1]/15 text-[#8b6cc1] flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#292825] dark:text-[#e7e5e4] truncate">
                            Midterm_Review_Notes.md
                          </p>
                          <p className="text-[9px] text-[#8a8880]">Updated 2h ago</p>
                        </div>
                        <span className="text-[9px] text-[#8a8880] font-mono shrink-0">12 KB</span>
                      </div>
                    </div>
                  )}

                  {/* Card 4: Study Groups */}
                  {feature.id === "study-groups" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#f0efeb] dark:border-[#333330]">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#5ea67f]" />
                          <span className="text-[11px] font-semibold text-[#292825] dark:text-[#e7e5e4]">
                            Systems Study Group
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[9px] font-mono text-[#5ea67f]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5ea67f] animate-pulse" /> 3 online
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1.5 items-center">
                          <div className="w-6 h-6 rounded-full bg-[#5ea67f]/20 border-2 border-white dark:border-[#20201e] flex items-center justify-center text-[9px] font-bold text-[#5ea67f]">
                            SN
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#d4a853]/20 border-2 border-white dark:border-[#20201e] flex items-center justify-center text-[9px] font-bold text-[#d4a853]">
                            AL
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#8b6cc1]/20 border-2 border-white dark:border-[#20201e] flex items-center justify-center text-[9px] font-bold text-[#8b6cc1]">
                            TK
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#eae8e2] dark:bg-[#383734] border-2 border-white dark:border-[#20201e] flex items-center justify-center text-[9px] font-medium text-[#787774]">
                            +4
                          </div>
                        </div>
                        <span className="text-[10px] text-[#787774] dark:text-[#a8a29e]">Shared Library</span>
                      </div>

                      <div className="p-1.5 rounded bg-white/70 dark:bg-[#1f1f1d]/70 border border-[#eae8e2] dark:border-[#333330] flex items-center gap-2 text-[10px] text-[#5f5e5b] dark:text-[#a8a29e]">
                        <Share2 className="w-3 h-3 text-[#5ea67f] shrink-0" />
                        <span className="truncate">Alex shared <b className="text-[#292825] dark:text-[#e7e5e4]">Threads_Quiz_Prep.pdf</b></span>
                      </div>
                    </div>
                  )}

                  {/* Card 5: Calendar Sync */}
                  {feature.id === "calendar-sync" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] space-y-2 text-xs">
                      <div className="grid grid-cols-5 gap-1 text-center text-[9px] pb-1 border-b border-[#f0efeb] dark:border-[#333330] font-mono text-[#8a8880]">
                        <div>Mon 13</div>
                        <div>Tue 14</div>
                        <div className="bg-[#5b8dd9]/15 text-[#5b8dd9] font-bold rounded py-0.5">Wed 15</div>
                        <div>Thu 16</div>
                        <div>Fri 17</div>
                      </div>

                      <div className="p-1.5 rounded bg-white/70 dark:bg-[#1f1f1d]/70 border-l-2 border-[#5b8dd9] border-t border-r border-b border-[#eae8e2] dark:border-[#333330]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#292825] dark:text-[#e7e5e4] truncate">
                            CS 301 Systems Lab
                          </span>
                          <span className="text-[9px] font-mono text-[#5b8dd9]">10:00 AM</span>
                        </div>
                        <p className="text-[9px] text-[#8a8880]">Hall B · Google Calendar</p>
                      </div>

                      <div className="p-1.5 rounded bg-white/70 dark:bg-[#1f1f1d]/70 border-l-2 border-[#8b6cc1] border-t border-r border-b border-[#eae8e2] dark:border-[#333330]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#292825] dark:text-[#e7e5e4] truncate">
                            Midterm Exam Submission
                          </span>
                          <span className="text-[9px] font-mono text-[#8b6cc1]">5:00 PM</span>
                        </div>
                        <p className="text-[9px] text-[#8a8880]">Outlook Academic Sync</p>
                      </div>
                    </div>
                  )}

                  {/* Card 6: Nemo AI */}
                  {feature.id === "nemo-ai" && (
                    <div className="bg-[#faf9f6] dark:bg-[#262624] rounded-lg p-3 border border-[#eceae4] dark:border-[#333330] space-y-2 text-xs">
                      <div className="flex justify-end">
                        <div className="bg-[#eae8e2] dark:bg-[#333330] text-[#292825] dark:text-[#f5f4f0] text-[10px] py-1 px-2.5 rounded-full max-w-[85%] truncate">
                          Explain Dijkstra's shortest path simply
                        </div>
                      </div>

                      <div className="bg-white/90 dark:bg-[#1f1f1d]/90 p-2 rounded-lg border border-[#eae8e2] dark:border-[#333330] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#d4689c]">
                          <Sparkles className="w-3 h-3" />
                          <span>Nemo AI Tutor</span>
                          <span className="ml-auto text-[8px] bg-[#d4689c]/10 text-[#d4689c] px-1 rounded font-mono">
                            Context Aware
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-[#5f5e5b] dark:text-[#c4c2be]">
                          Like ripples in a pond: always visit the closest unvisited node first to guarantee optimal paths.
                        </p>
                        <div className="pt-1 border-t border-[#f0efeb] dark:border-[#333330] flex items-center justify-between text-[9px] text-[#8a8880] font-mono">
                          <span>📖 Lecture 6, Slide 18</span>
                          <span className="text-[#d4689c] font-semibold">Ask follow-up →</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesHorizontal;
