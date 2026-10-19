"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Clock,
  CheckSquare,
  FileText,
  Users,
  CalendarDays,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  src: string;
  alt: string;
  path: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "focus-timer",
    label: "Focus Timer",
    icon: Clock,
    src: "/screenshots/focus-timer.png",
    alt: "Athena Focus Timer interface showing pomodoro session tracker",
    path: "focus-timer",
    description: "Work in focused 25-minute blocks with custom intervals and session history.",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    src: "/screenshots/tasks.png",
    alt: "Athena Tasks board with priority sorting and deadlines",
    path: "tasks",
    description: "Keep deadlines, study goals, and priority coursework organized in one clear view.",
  },
  {
    id: "resources",
    label: "Resources",
    icon: FileText,
    src: "/screenshots/resources.png",
    alt: "Athena Course resources library and lecture files",
    path: "resources",
    description: "Access, organize, and search through lecture slides, handouts, and notes.",
  },
  {
    id: "study-groups",
    label: "Study Groups",
    icon: Users,
    src: "/screenshots/study-groups.png",
    alt: "Athena Study Groups collaborative space",
    path: "study-groups",
    description: "Collaborate with classmates, share documents, and stay aligned on group tasks.",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    src: "/screenshots/calendar.png",
    alt: "Athena Academic Calendar schedule overview",
    path: "calendar",
    description: "Sync your academic calendar to view classes, deadlines, and study blocks.",
  },
  {
    id: "pdf-viewer",
    label: "PDF Viewer",
    icon: BookOpen,
    src: "/screenshots/pdf-viewer.png",
    alt: "Athena PDF Viewer with notes, search, and highlights",
    path: "pdf-viewer",
    description: "Read, search, annotate, and highlight course materials directly in Athena.",
  },
];

export function ScreenshotsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Setup GSAP 3D context
  useGSAP(
    () => {
      if (reduceMotion || !frameRef.current) return;
      gsap.set(frameRef.current, {
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      });
    },
    { scope: containerRef, dependencies: [reduceMotion] }
  );

  // Auto-rotate through tabs every 4 seconds (pauses on hover and when reduced motion is requested)
  const nextTab = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % TABS.length);
  }, []);

  useEffect(() => {
    if (isHovered || reduceMotion) return;

    const interval = setInterval(nextTab, 4000);
    return () => clearInterval(interval);
  }, [isHovered, reduceMotion, nextTab, activeIndex]);

  // Handle 3D perspective tilt reacting to mouse position
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion || !containerRef.current || !frameRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle tilt (-3.5deg to +3.5deg) for a gentle, elegant 3D feel
      const rotateX = ((y - centerY) / centerY) * -3.5;
      const rotateY = ((x - centerX) / centerX) * 3.5;

      gsap.to(frameRef.current, {
        rotateX,
        rotateY,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.45,
        overwrite: "auto",
      });
    },
    [reduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (reduceMotion || !frameRef.current) return;

    gsap.to(frameRef.current, {
      rotateX: 0,
      rotateY: 0,
      ease: "power2.out",
      duration: 0.7,
      overwrite: "auto",
    });
  }, [reduceMotion]);

  // Keyboard navigation for tablist
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % TABS.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + TABS.length) % TABS.length);
      }
    },
    []
  );

  const currentTab = TABS[activeIndex];

  return (
    <motion.section
      id="product-tour"
      aria-label="Athena product showcase"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-[#faf9f6] dark:bg-[#1a1918] py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-y border-[#e9e8e4] dark:border-stone-800 transition-colors"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#37352f] dark:text-stone-100">
            See it in action
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#5f5e5b] dark:text-stone-400 leading-relaxed">
            A calmer workspace built for students who want to stay on top of things.
          </p>
        </div>

        {/* Interactive Tab Buttons */}
        <div
          role="tablist"
          aria-label="Product feature tabs"
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-10 max-w-4xl mx-auto px-2"
        >
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeIndex === idx;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(idx)}
                className={`
                  group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium
                  transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-stone-400 focus-visible:ring-offset-2
                  ${
                    isActive
                      ? "bg-[#20201e] text-white shadow-md shadow-black/10 dark:bg-stone-100 dark:text-stone-900"
                      : "bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-[#e9e8e4] dark:bg-stone-800/80 dark:hover:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:text-stone-100"
                  }
                `}
              >
                <Icon
                  size={15}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-white dark:text-stone-900"
                      : "text-stone-500 group-hover:text-stone-700 dark:text-stone-400 dark:group-hover:text-stone-200"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Large Screenshot Showcase Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className="max-w-[1000px] w-full mx-auto"
          style={{ perspective: "1200px" }}
        >
          <div
            ref={frameRef}
            className="relative w-full rounded-2xl bg-white dark:bg-stone-900 border border-[#e9e8e4] dark:border-stone-800 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.08)] will-change-transform transition-[border-color,background-color] duration-300"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Subtle Browser Chrome Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f7f6f3]/90 dark:bg-stone-900/90 border-b border-[#e9e8e4] dark:border-stone-800 backdrop-blur-sm select-none">
              {/* Traffic Light Window Controls */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
              </div>

              {/* Address / URL Bar */}
              <div className="flex items-center justify-center max-w-xs sm:max-w-sm md:max-w-md w-full mx-2 sm:mx-4">
                <div className="w-full bg-white dark:bg-stone-800/80 rounded-md border border-[#e9e8e4] dark:border-stone-700/60 px-3 py-1 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-mono truncate shadow-xs">
                  <span className="text-stone-400 dark:text-stone-500 hidden sm:inline">https://</span>
                  <span className="text-stone-700 dark:text-stone-200 font-medium">athena.study</span>
                  <span className="text-stone-400 dark:text-stone-500">/{currentTab.path}</span>
                </div>
              </div>

              {/* Feature indicator count */}
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400">
                  {activeIndex + 1} / {TABS.length}
                </span>
              </div>
            </div>

            {/* Screenshot Display Area with Motion Crossfade */}
            <div
              role="tabpanel"
              id={`panel-${currentTab.id}`}
              aria-labelledby={`tab-${currentTab.id}`}
              className="relative aspect-[16/10] sm:aspect-[16/9.5] w-full bg-stone-100 dark:bg-stone-950 overflow-hidden"
            >
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={currentTab.id}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.98, y: 12 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.98, y: -12 }
                  }
                  transition={{
                    duration: 0.38,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 w-full h-full"
                >
                  <Image
                    src={currentTab.src}
                    alt={currentTab.alt}
                    fill
                    priority={activeIndex === 0}
                    sizes="(max-width: 1024px) 100vw, 1000px"
                    className="object-cover object-top select-none pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Caption Bar */}
            <div className="px-4 py-2.5 bg-white/95 dark:bg-stone-900/95 border-t border-[#e9e8e4]/60 dark:border-stone-800/80 flex items-center justify-between text-xs text-[#5f5e5b] dark:text-stone-400">
              <span className="truncate">{currentTab.description}</span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0 ml-3">
                {isHovered ? "Paused" : "Auto-playing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default ScreenshotsSection;
