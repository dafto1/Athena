"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, useReducedMotion } from "motion/react";

gsap.registerPlugin(useGSAP);

interface FeaturePill {
  emoji: string;
  label: string;
}

const FEATURE_PILLS: FeaturePill[] = [
  { emoji: "✓", label: "Tasks" },
  { emoji: "⏱", label: "Focus Timer" },
  { emoji: "📄", label: "Resources" },
  { emoji: "👥", label: "Study Groups" },
  { emoji: "📅", label: "Calendar" },
  { emoji: "🤖", label: "AI Assistant" },
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      // Respect accessibility preferences
      if (reduceMotion) {
        gsap.set(
          [
            ".hero-eyebrow",
            ".hero-char",
            ".hero-subtitle",
            ".hero-ctas",
            ".hero-pill-entrance",
          ],
          { opacity: 1, y: 0, scale: 1, rotateX: 0 }
        );
        gsap.set(".hero-brush-bg", { scaleX: 1 });
        gsap.set(".hero-brush-stroke", { strokeDashoffset: 0 });
        return;
      }

      // 1. Animated gradient orb floating slowly in a figure-8 (lemniscate) pattern
      if (orbRef.current) {
        const orbTl = gsap.timeline({ repeat: -1 });
        orbTl
          .to(orbRef.current, { x: 65, y: -35, duration: 3.8, ease: "sine.inOut" })
          .to(orbRef.current, { x: 95, y: 0, duration: 3.2, ease: "sine.inOut" })
          .to(orbRef.current, { x: 65, y: 35, duration: 3.8, ease: "sine.inOut" })
          .to(orbRef.current, { x: 0, y: 0, duration: 3.2, ease: "sine.inOut" })
          .to(orbRef.current, { x: -65, y: -35, duration: 3.8, ease: "sine.inOut" })
          .to(orbRef.current, { x: -95, y: 0, duration: 3.2, ease: "sine.inOut" })
          .to(orbRef.current, { x: -65, y: 35, duration: 3.8, ease: "sine.inOut" })
          .to(orbRef.current, { x: 0, y: 0, duration: 3.2, ease: "sine.inOut" });

        // Gentle breathing scale for organic warmth
        gsap.to(orbRef.current, {
          scale: 1.09,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // 2. Entrance sequence timeline
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.12,
      });

      // Step 1: Eyebrow fades in and slides up
      timeline.fromTo(
        ".hero-eyebrow",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6 }
      );

      // Step 2: Headline characters reveal with a stagger (SplitText-like)
      timeline.fromTo(
        ".hero-char",
        { opacity: 0, y: 24, rotateX: -18 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.45,
          stagger: 0.018,
          ease: "power3.out",
        },
        "-=0.25"
      );

      // Underline brush stroke & marker background reveal on "clear"
      timeline.fromTo(
        ".hero-brush-bg",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "power2.out" },
        "-=0.2"
      );
      timeline.fromTo(
        ".hero-brush-stroke",
        { strokeDashoffset: 320 },
        { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" },
        "<"
      );

      // Step 3: Subtitle fades in
      timeline.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55 },
        "-=0.3"
      );

      // Step 4: CTAs slide up
      timeline.fromTo(
        ".hero-ctas",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55 },
        "-=0.25"
      );

      // Step 5: Feature pills pop in with spring physics
      timeline.fromTo(
        ".hero-pill-entrance",
        { opacity: 0, scale: 0.65, y: 22 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.07,
          ease: "back.out(2)",
        },
        "-=0.2"
      );
    },
    { scope: containerRef, dependencies: [reduceMotion] }
  );

  // Helper to split words into animatable character spans without breaking layout
  const renderWord = (word: string, isClearOrIndex: boolean | number = false, isClear = false) => {
    const clear = typeof isClearOrIndex === "boolean" ? isClearOrIndex : isClear;
    const wordKey = typeof isClearOrIndex === "number" ? isClearOrIndex : 0;
    return (
      <span
        key={`${word}-${wordKey}`}
        className={`inline-block whitespace-nowrap ${
          clear ? "relative inline-block" : ""
        }`}
      >
        {word.split("").map((char, charIdx) => (
          <span
            key={charIdx}
            className="hero-char inline-block"
            style={{ willChange: "transform, opacity" }}
          >
            {char}
          </span>
        ))}
        {isClear && (
          <>
            {/* Soft amber highlighter backdrop */}
            <span
              className="hero-brush-bg absolute left-[-2%] bottom-0 sm:bottom-0.5 w-[104%] h-2.5 sm:h-3.5 bg-gradient-to-r from-amber-200/40 via-amber-300/50 to-amber-200/30 rounded-sm -rotate-1 -z-10"
              style={{ transformOrigin: "left center" }}
              aria-hidden="true"
            />
            {/* Animated brush stroke path */}
            <svg
              className="hero-underline absolute -bottom-2 sm:-bottom-3.5 left-[-4%] w-[108%] h-3.5 sm:h-5 pointer-events-none overflow-visible -z-10"
              viewBox="0 0 160 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 3 13 C 38 6, 95 15, 157 8 C 122 13, 62 10, 18 14"
                stroke="url(#clear-brush-gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hero-brush-stroke"
              />
              <defs>
                <linearGradient
                  id="clear-brush-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#d4a339" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#e2b85c" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </>
        )}
      </span>
    );
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-white dark:bg-[#171717] px-4 sm:px-6 lg:px-8 py-20 sm:py-24"
    >
      {/* Warm off-white subtle wash */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(250,248,243,0.85)_0%,rgba(255,255,255,0)_80%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(32,32,30,0.85)_0%,rgba(23,23,23,0)_80%)] -z-20"
        aria-hidden="true"
      />

      {/* Floating animated gradient orb (warm gold / amber tones moving in figure-8) */}
      <div
        ref={orbRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] md:w-[840px] md:h-[840px] rounded-full opacity-65 dark:opacity-25 blur-[95px] sm:blur-[130px] -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 214, 137, 0.45) 0%, rgba(226, 184, 92, 0.25) 35%, rgba(245, 235, 215, 0.08) 65%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Hero content shell */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow badge */}
        <div className="hero-eyebrow inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbfbfa] dark:bg-[#20201e] border border-[#e9e8e4] dark:border-[#383734] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-[11px] font-semibold tracking-[0.16em] text-[#77756f] dark:text-[#a8a29e] uppercase select-none">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300/50 dark:border-amber-700/50">
            <Sparkles className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400 text-amber-600 dark:text-amber-400" />
          </span>
          <span>THE STUDENT WORKSPACE</span>
        </div>

        {/* Massive headline */}
        <h1
          aria-label="All your studying. One clear space."
          className="hero-headline mt-6 sm:mt-8 font-bold text-[#292825] dark:text-[#f3f1ec] max-w-5xl mx-auto select-none"
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            letterSpacing: "-4px",
            lineHeight: 1.02,
          }}
        >
          <span className="block" aria-hidden="true">
            {renderWord("All")} {renderWord("your")}{" "}
            {renderWord("studying.")}
          </span>
          <span className="block mt-1 sm:mt-2" aria-hidden="true">
            {renderWord("One")}{" "}
            {renderWord("clear", true)}{" "}
            {renderWord("space.")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-[#787774] dark:text-[#a8a29e] max-w-2xl mx-auto leading-relaxed font-normal">
          Tasks, focus sessions, course files, and study groups — together in one
          calm workspace.
        </p>

        {/* CTA buttons */}
        <div className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-[#292825] dark:bg-[#e7e5e4] hover:bg-[#3d3b36] dark:hover:bg-white text-white dark:text-[#171717] text-sm font-medium transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Create your space</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-3 text-sm font-medium text-[#66645f] hover:text-[#292825] dark:text-[#a8a29e] dark:hover:text-[#f3f1ec] hover:underline underline-offset-4 transition-colors"
          >
            I have an account
          </Link>
        </div>

        {/* Floating feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-3xl mx-auto mt-12 sm:mt-16 px-2">
          {FEATURE_PILLS.map((pill, index) => (
            <div key={pill.label} className="hero-pill-entrance">
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [-4, 4, -4],
                      }
                }
                transition={{
                  duration: 3.4 + index * 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.22,
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbfbfa]/95 dark:bg-[#20201e]/95 backdrop-blur-xs border border-[#e9e8e4] dark:border-[#383734] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-sm hover:border-[#dedcd5] dark:hover:border-[#4d4a43] transition-colors cursor-default select-none"
              >
                <span className="text-xs sm:text-sm" aria-hidden="true">
                  {pill.emoji}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#37352f] dark:text-[#e7e5e4] whitespace-nowrap">
                  {pill.label}
                </span>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Brush stroke CSS helper */}
      <style>{`
        .hero-brush-stroke {
          stroke-dasharray: 320;
          stroke-dashoffset: 320;
          filter: drop-shadow(0 1px 2px rgba(217, 119, 6, 0.15));
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-brush-stroke {
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
