"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import { Upload, Timer, Brain } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function StitchRoutine() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;

      const titleLines = el.querySelectorAll(".routine-title-line");
      const desc = el.querySelector(".routine-desc");
      const cards = el.querySelectorAll(".routine-card");

      if (reduceMotion) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      if (titleLines.length) {
        tl.fromTo(
          titleLines,
          { yPercent: 115, opacity: 0, filter: "blur(8px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.08, ease: "power3.out" }
        );
      }

      if (desc) {
        tl.fromTo(
          desc,
          { y: 18, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
          "-=0.5"
        );
      }

      if (cards.length) {
        tl.fromTo(
          cards,
          { y: 28, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.14,
            duration: 0.85,
            ease: "power3.out",
          },
          "-=0.4"
        );
      }
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-20 w-full py-24 px-6 lg:px-12 max-w-7xl mx-auto bg-[#FAF9F6]"
      id="how-it-works"
    >
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="font-mono-stitch text-xs text-[#77756F] uppercase tracking-wider font-bold">
          Daily Scholar Routine
        </span>
        <h2 className="mt-2 font-serif-stitch text-3xl md:text-5xl text-[#292825] font-semibold">
          <div className="overflow-hidden pb-1">
            <span className="routine-title-line inline-block will-change-transform">
              A rhythm that protects
            </span>
          </div>
          <div className="overflow-hidden">
            <span className="routine-title-line inline-block italic font-normal text-[#292825] will-change-transform">
              your mental clarity.
            </span>
          </div>
        </h2>
        <p className="routine-desc mt-3 font-space-stitch text-sm md:text-base text-[#77756F] will-change-transform">
          Three stages designed to eliminate clutter and protect deep, uninterrupted focus.
        </p>
      </div>

      {/* Interactive Connected Progress Timeline */}
      <div className="relative">
        {/* Connecting Line Behind */}
        <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-[#E8E6E0] -translate-y-12 z-0" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Step 01 */}
          <div className="routine-card bg-white p-8 rounded-lg border-2 border-[#292825]/20 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden will-change-transform">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#EEE0BA]/30 rounded-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-stitch text-4xl text-[#292825] font-bold">01</span>
                <span className="font-mono-stitch text-[10px] bg-[#F5F4F0] text-[#292825] px-2 py-0.5 rounded font-semibold uppercase border border-[#E8E6E0]">
                  Setup Phase
                </span>
              </div>
              <h3 className="font-serif-stitch text-xl text-[#292825] font-bold">
                Establish syllabus baseline
              </h3>
              <p className="mt-3 font-space-stitch text-xs md:text-sm text-[#77756F] leading-relaxed">
                Upload your course syllabus to generate timelines, milestones, and weekly targets automatically.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E8E6E0] flex items-center justify-between text-xs">
              <div>
                <p className="font-mono-stitch text-[10px] text-[#77756F] uppercase tracking-wider">
                  Setup Effort
                </p>
                <p className="font-space-stitch font-semibold text-[#292825] mt-0.5">
                  &lt; 5 minutes per course
                </p>
              </div>
              <Upload className="w-5 h-5 text-[#B85D38]" />
            </div>
          </div>

          {/* Step 02 */}
          <div className="routine-card bg-white p-8 rounded-lg border border-[#E8E6E0] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden will-change-transform">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-stitch text-4xl text-[#576055] font-bold">02</span>
                <span className="font-mono-stitch text-[10px] bg-[#E6EAE5] text-[#576055] px-2 py-0.5 rounded font-semibold uppercase border border-[#E8E6E0]">
                  Execution Phase
                </span>
              </div>
              <h3 className="font-serif-stitch text-xl text-[#292825] font-bold">
                Isolate priority & start timer
              </h3>
              <p className="mt-3 font-space-stitch text-xs md:text-sm text-[#77756F] leading-relaxed">
                Select your highest-leverage priority and enter an acoustically protected, timed deep focus session.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E8E6E0] flex items-center justify-between text-xs">
              <div>
                <p className="font-mono-stitch text-[10px] text-[#77756F] uppercase tracking-wider">
                  Focus Impact
                </p>
                <p className="font-space-stitch font-semibold text-[#292825] mt-0.5">
                  Zero notification noise
                </p>
              </div>
              <Timer className="w-5 h-5 text-[#576055]" />
            </div>
          </div>

          {/* Step 03 */}
          <div className="routine-card bg-white p-8 rounded-lg border border-[#E8E6E0] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden will-change-transform">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif-stitch text-4xl text-[#292825] font-bold">03</span>
                <span className="font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-2 py-0.5 rounded font-semibold uppercase border border-[#E2B85C]/30">
                  Retention Phase
                </span>
              </div>
              <h3 className="font-serif-stitch text-xl text-[#292825] font-bold">
                Review & consolidate knowledge
              </h3>
              <p className="mt-3 font-space-stitch text-xs md:text-sm text-[#77756F] leading-relaxed">
                Synthesize reading highlights into margin notes, generate flashcards with Nemo, and archive for finals.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E8E6E0] flex items-center justify-between text-xs">
              <div>
                <p className="font-mono-stitch text-[10px] text-[#77756F] uppercase tracking-wider">
                  Retention Value
                </p>
                <p className="font-space-stitch font-semibold text-[#292825] mt-0.5">
                  Long-term conceptual recall
                </p>
              </div>
              <Brain className="w-5 h-5 text-[#E2B85C]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
