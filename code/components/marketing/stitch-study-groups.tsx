"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Users, Share2, FileText, Pin, FolderSync, CheckSquare, Clock } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function StitchStudyGroups() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;

      const frame = el.querySelector(".groups-frame");
      const titleLines = el.querySelectorAll(".groups-title-line");
      const desc = el.querySelector(".groups-desc");
      const listItems = el.querySelectorAll(".groups-item");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      if (frame) {
        tl.fromTo(
          frame,
          { y: 50, opacity: 0, scale: 0.91, rotateX: 3, transformPerspective: 1200 },
          { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.1, ease: "power3.out" },
          0
        );
      }

      if (titleLines.length) {
        tl.fromTo(
          titleLines,
          { yPercent: 115, opacity: 0, filter: "blur(8px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.08, ease: "power3.out" },
          0.15
        );
      }

      if (desc) {
        tl.fromTo(
          desc,
          { y: 16, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
          "-=0.5"
        );
      }

      if (listItems.length) {
        tl.fromTo(
          listItems,
          { opacity: 0, y: 18, filter: "blur(4px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.1, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="w-full py-24 px-6 lg:px-12 max-w-7xl mx-auto" id="study-groups">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Collaborative Live Mockup */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <div className="groups-frame bg-white rounded-xl border border-[#E8E6E0] shadow-md p-6 space-y-5 will-change-transform">
            {/* Room Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E6E0] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-stitch text-[10px] bg-[#E6EAE5] text-[#576055] border border-[#E8E6E0] px-2 py-0.5 rounded font-bold uppercase">
                    Live Sprint Lobby
                  </span>
                  <span className="font-mono-stitch text-xs text-[#77756F]">Exam: Nov 14</span>
                </div>
                <h3 className="font-serif-stitch text-base md:text-xl text-[#292825] font-bold mt-1">
                  Bio 204: Cellular Biology Finals Group
                </h3>
              </div>

              {/* Presence Avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden font-mono-stitch">
                  <div
                    className="w-8 h-8 rounded-full bg-[#EEE0BA] text-[#292825] border-2 border-white flex items-center justify-center font-bold text-xs"
                    title="Marcus (Krebs Cycle)"
                  >
                    MK
                  </div>
                  <div
                    className="w-8 h-8 rounded-full bg-[#E6EAE5] text-[#576055] border-2 border-white flex items-center justify-center font-bold text-xs"
                    title="David (Highlighting Ch. 9)"
                  >
                    DW
                  </div>
                  <div
                    className="w-8 h-8 rounded-full bg-[#E8E6E0] text-[#292825] border-2 border-white flex items-center justify-center font-bold text-xs"
                    title="Sara (Membrane Potential)"
                  >
                    ST
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F5F4F0] text-[#77756F] border-2 border-white flex items-center justify-center font-bold text-xs">
                    +3
                  </div>
                </div>
                <button className="px-2.5 py-1 text-xs font-mono-stitch font-semibold bg-[#F5F4F0] hover:bg-[#E8E6E0] rounded text-[#292825] border border-[#E8E6E0] flex items-center gap-1 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Shared Live Scratchpad */}
            <div className="p-4 rounded bg-[#FAF9F6] border border-[#E8E6E0] relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-stitch text-[11px] font-bold uppercase text-[#292825] flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-[#B85D38]" /> Shared Exam Cheat Sheet
                </span>
                <span className="font-mono-stitch text-[10px] text-[#576055] font-semibold">
                  Synced 1s ago
                </span>
              </div>
              <div className="space-y-2 font-mono-stitch text-xs">
                <p className="text-[#292825] leading-relaxed">
                  1. <strong className="text-[#B85D38]">Glycolysis:</strong> Cytoplasm • Net yield: 2 ATP + 2 NADH
                </p>
                <p className="text-[#576055] leading-relaxed relative">
                  2. <strong className="text-[#292825]">Pyruvate Oxidation:</strong> Mitochondrial matrix • Acetyl-CoA + 1 CO2
                  <span className="inline-block w-0.5 h-3.5 bg-[#292825] animate-pulse ml-1 align-middle" />
                </p>
                <p className="text-[#77756F] leading-relaxed">
                  3. <strong className="text-[#292825]">Krebs Cycle:</strong> 2 turns per glucose • 6 NADH, 2 FADH2, 2 ATP
                </p>
              </div>
            </div>

            {/* Active Sprint Timer Banner */}
            <div className="p-3 bg-[#F5F4F0] rounded border border-[#E8E6E0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono-stitch">
                <div className="w-2.5 h-2.5 rounded-full bg-[#576055] animate-pulse" />
                <span className="font-bold text-[#292825]">Sprint 2/3:</span>
                <span className="text-[#77756F]">14:22 remaining</span>
              </div>
              <span className="font-mono-stitch text-[10px] text-[#77756F]">
                Audio: Archival Library (Shared)
              </span>
            </div>

            {/* Cohort Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded bg-white border border-[#E8E6E0] flex items-start justify-between">
                <div>
                  <span className="font-mono-stitch text-[10px] text-[#B85D38] font-bold uppercase">
                    Shared Binder
                  </span>
                  <p className="font-space-stitch text-xs font-semibold text-[#292825] mt-0.5">
                    Past Finals &amp; Problem Sets (2022–2025)
                  </p>
                </div>
                <FileText className="w-4 h-4 text-[#77756F]" />
              </div>

              <div className="p-3 rounded bg-white border border-[#E8E6E0]">
                <div className="flex items-center justify-between">
                  <span className="font-mono-stitch text-[10px] text-[#576055] font-bold uppercase">
                    Live Cheat Sheet
                  </span>
                  <span className="font-mono-stitch text-[9px] bg-[#E6EAE5] text-[#576055] px-1 rounded">
                    4 viewing
                  </span>
                </div>
                <p className="font-mono-stitch text-[10px] text-[#77756F] mt-2">
                  Edited yesterday by David
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Editorial Text */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#E6EAE5] text-[#576055] border border-[#E8E6E0]">
            <Users className="w-4 h-4" />
            <span className="font-mono-stitch text-xs uppercase tracking-wider font-bold">
              Quiet Collaboration
            </span>
          </div>

          <h2 className="font-serif-stitch text-3xl md:text-5xl text-[#292825] font-semibold leading-tight">
            <div className="overflow-hidden pb-1">
              <span className="groups-title-line inline-block will-change-transform">
                Coordinate exam prep
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="groups-title-line inline-block will-change-transform">
                <span className="italic font-normal">without the chaos</span> of group chats.
              </span>
            </div>
          </h2>

          <p className="groups-desc font-space-stitch text-sm md:text-base text-[#77756F] leading-relaxed will-change-transform">
            Real-time collaborative synthesis and synchronized focus sprints designed to eliminate distraction, social notification anxiety, and disorganized files.
          </p>

          <ul className="space-y-3 font-space-stitch text-xs md:text-sm text-[#292825]">
            <li className="groups-item flex items-start gap-3 will-change-transform">
              <FolderSync className="w-5 h-5 text-[#576055] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Shared Cohort Vault:</strong> Syllabi, lecture recordings, and exam materials unified in one central space.
              </span>
            </li>
            <li className="groups-item flex items-start gap-3 will-change-transform">
              <CheckSquare className="w-5 h-5 text-[#576055] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Equitable Task Division:</strong> Distribute chapters, practice problems, and cheat sheet duties cleanly.
              </span>
            </li>
            <li className="groups-item flex items-start gap-3 will-change-transform">
              <Clock className="w-5 h-5 text-[#576055] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Silent Sprints:</strong> Coordinated Pomodoro intervals with shared ambient audio and zero messaging clutter.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
