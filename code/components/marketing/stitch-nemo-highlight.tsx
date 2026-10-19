"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileText,
  Copy,
  Bookmark,
  Send,
  Paperclip,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface QueryData {
  id: string;
  buttonLabel: string;
  sourceDoc: string;
  userQuestion: string;
  aiSummary: string;
  citations: {
    title: string;
    citation: string;
    body: string;
  }[];
}

const queries: Record<string, QueryData> = {
  memory: {
    id: "memory",
    buttonLabel: "Atkinson & Shiffrin Stores",
    sourceDoc: "Atkinson & Shiffrin (1968) Human Memory.pdf",
    userQuestion:
      "What are the three stages of memory according to Atkinson and Shiffrin in Chapter 2, and what are their transfer mechanisms?",
    aiSummary:
      "According to Atkinson and Shiffrin (1968, Ch. 2), human memory operates via three structurally distinct stores:",
    citations: [
      {
        title: "1. Sensory Memory",
        citation: "[Ch. 2, Page 41]",
        body: "Holds environmental perceptual input for brief fractions of a second before decaying or advancing via selective attention.",
      },
      {
        title: "2. Short-Term Store (STS)",
        citation: "[Ch. 2, Page 44]",
        body: "Active workspace lasting 15–30 seconds. Maintained through active rehearsal; transfers to long-term storage via elaborative encoding.",
      },
      {
        title: "3. Long-Term Store (LTS)",
        citation: "[Ch. 2, Page 52]",
        body: "Relatively permanent repository with infinite capacity. Information is retrieved back into STS for conscious reasoning.",
      },
    ],
  },
  chemistry: {
    id: "chemistry",
    buttonLabel: "Organic Chem SN1 vs SN2",
    sourceDoc: "Vollhardt & Schore Organic Chemistry (Ch. 6).pdf",
    userQuestion:
      "Compare the stereochemical outcomes of SN1 versus SN2 nucleophilic substitutions from Chapter 6.",
    aiSummary:
      "Per Chapter 6, nucleophilic substitution stereochemistry differs fundamentally by mechanism:",
    citations: [
      {
        title: "1. SN1 Mechanism (Carbocation Intermediate)",
        citation: "[Ch. 6, Page 218]",
        body: "Planar sp² carbocation allows nucleophilic attack from either face, producing racemization with slight frontside shielding bias.",
      },
      {
        title: "2. SN2 Mechanism (Concerted Backside Attack)",
        citation: "[Ch. 6, Page 224]",
        body: "Single-step backside displacement of the leaving group forces complete Walden inversion of the stereocenter.",
      },
    ],
  },
};

export function StitchNemoHighlight() {
  const [activeQueryKey, setActiveQueryKey] = useState<string>("memory");
  const [copied, setCopied] = useState(false);

  const query = queries[activeQueryKey] || queries.memory;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nemoRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const el = nemoRef.current;
      if (!el) return;

      const titleLines = el.querySelectorAll(".nemo-title-line");
      const desc = el.querySelector(".nemo-desc");
      const box = el.querySelector(".nemo-box");
      const tags = el.querySelector(".nemo-tags");
      const frame = el.querySelector(".nemo-frame");

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
          { y: 16, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
          "-=0.5"
        );
      }

      if (box) {
        tl.fromTo(
          box,
          { y: 16, opacity: 0, scale: 0.985 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" },
          "-=0.4"
        );
      }

      if (tags) {
        tl.fromTo(
          tags,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        );
      }

      if (frame) {
        tl.fromTo(
          frame,
          { y: 30, opacity: 0, scale: 0.985, rotateX: 0.8, transformPerspective: 1200 },
          { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.1, ease: "power3.out" },
          "-=0.6"
        );
      }
    },
    { scope: nemoRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={nemoRef}
      className="w-full bg-[#F5F4F0] py-24 px-6 lg:px-12 border-y border-[#E8E6E0]"
      id="nemo-ai"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Editorial Pitch */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#EEE0BA] text-[#292825] border border-[#E2B85C]/40">
            <Sparkles className="w-4 h-4 text-[#B85D38]" />
            <span className="font-mono-stitch text-xs uppercase tracking-wider font-bold">
              Grounded AI Architecture
            </span>
          </div>

          <h2 className="font-serif-stitch text-3xl md:text-5xl text-[#292825] font-semibold leading-tight">
            <div className="overflow-hidden pb-1">
              <span className="nemo-title-line inline-block will-change-transform">
                An AI assistant that cites its sources,
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="nemo-title-line inline-block italic font-normal text-[#292825] will-change-transform">
                never its imagination.
              </span>
            </div>
          </h2>

          <p className="nemo-desc font-space-stitch text-sm md:text-base text-[#77756F] leading-relaxed will-change-transform">
            Query your readings with confidence. Nemo pinpoints exact pages, figures, and excerpts for instant citation verification.
          </p>

          {/* Honest Boundaries Callout Box */}
          <div className="nemo-box p-4 bg-white rounded border-l-4 border-[#292825] space-y-1.5 shadow-2xs border border-[#E8E6E0] will-change-transform">
            <div className="flex items-center gap-2 font-mono-stitch text-xs font-bold text-[#292825]">
              <ShieldCheck className="w-4 h-4 text-[#E2B85C]" />
              <span>Honest Boundaries Commitment</span>
            </div>
            <p className="font-space-stitch text-xs text-[#77756F] leading-relaxed">
              Strictly limited to your course files—no hallucinations or unverified web claims.
            </p>
          </div>

          {/* Feature Tags */}
          <div className="nemo-tags flex flex-wrap items-center gap-4 text-xs font-mono-stitch text-[#77756F] pt-2 will-change-transform">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-[#576055]" /> Multi-page OCR
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-[#576055]" /> Direct PDF Highlighting
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-[#576055]" /> Zero LLM Data Training
            </span>
          </div>
        </div>

        {/* Right Interactive Nemo UI Mockup */}
        <div className="lg:col-span-7">
          <div className="nemo-frame bg-white rounded-xl border border-[#E8E6E0] shadow-md overflow-hidden will-change-transform">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#F5F4F0] border-b border-[#E8E6E0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#EEE0BA] text-[#292825] flex items-center justify-center font-bold text-xs border border-[#E2B85C]/40">
                  <FileText className="w-4 h-4 text-[#292825]" />
                </div>
                <div>
                  <p className="font-mono-stitch text-xs font-bold text-[#292825]">
                    Nemo AI Research Companion
                  </p>
                  <p className="font-space-stitch text-[11px] text-[#77756F]">
                    Source: {query.sourceDoc}
                  </p>
                </div>
              </div>
              <span className="font-mono-stitch text-[10px] bg-[#E6EAE5] text-[#576055] border border-[#E8E6E0] px-2 py-0.5 rounded font-bold uppercase">
                Grounded Mode
              </span>
            </div>

            {/* Prompt Preset Buttons */}
            <div className="bg-[#F5F4F0] px-5 py-2.5 border-b border-[#E8E6E0] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#77756F] text-[11px] font-semibold whitespace-nowrap font-space-stitch">
                Try Prompt:
              </span>
              <button
                onClick={() => setActiveQueryKey("memory")}
                className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap font-mono-stitch ${
                  activeQueryKey === "memory"
                    ? "bg-white border-[#E8E6E0] text-[#292825] font-semibold shadow-2xs"
                    : "bg-[#E8E6E0]/60 border-[#E8E6E0] text-[#77756F] hover:bg-white"
                }`}
              >
                Atkinson & Shiffrin Stores
              </button>
              <button
                onClick={() => setActiveQueryKey("chemistry")}
                className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap font-mono-stitch ${
                  activeQueryKey === "chemistry"
                    ? "bg-white border-[#E8E6E0] text-[#292825] font-semibold shadow-2xs"
                    : "bg-[#E8E6E0]/60 border-[#E8E6E0] text-[#77756F] hover:bg-white"
                }`}
              >
                Organic Chem SN1 vs SN2
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-6 space-y-5 min-h-[340px]">
              {/* User Message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-[#F5F4F0] text-[#292825] max-w-lg p-3.5 rounded-lg border border-[#E8E6E0] shadow-2xs">
                  <p className="font-space-stitch text-xs font-medium">
                    {query.userQuestion}
                  </p>
                  <span className="font-mono-stitch text-[10px] text-[#77756F] block mt-1 text-right">
                    Elena • 10:14 AM
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#EEE0BA] text-[#292825] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#E2B85C]/40">
                  EL
                </div>
              </div>

              {/* AI Answer Message */}
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#F5F4F0] text-[#292825] flex items-center justify-center flex-shrink-0 border border-[#E8E6E0]">
                  <Sparkles className="w-4 h-4 text-[#E2B85C]" />
                </div>
                <div className="bg-white text-[#292825] max-w-xl p-4 rounded-lg border border-[#E8E6E0] space-y-3 shadow-xs">
                  <p className="font-space-stitch text-xs leading-relaxed">
                    {query.aiSummary}
                  </p>

                  {/* Cited Breakdown Cards */}
                  <div className="space-y-2">
                    {query.citations.map((c, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#FAF9F6] border border-[#E8E6E0]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                            {c.title}
                          </span>
                          <span className="font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:bg-[#E2B85C]/40">
                            {c.citation}
                          </span>
                        </div>
                        <p className="font-space-stitch text-[11px] text-[#77756F]">
                          {c.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Footer actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#E8E6E0]">
                    <span className="font-mono-stitch text-[10px] text-[#576055] font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-[#576055]" /> Grounded in {query.citations.length} verified PDF citations
                    </span>
                    <div className="flex items-center gap-1.5 font-mono-stitch text-[11px]">
                      <button
                        onClick={handleCopy}
                        className="px-2 py-0.5 hover:bg-[#F5F4F0] rounded text-[#77756F] hover:text-[#292825] flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button className="px-2 py-0.5 hover:bg-[#F5F4F0] rounded text-[#77756F] hover:text-[#292825] flex items-center gap-1 transition-colors">
                        <Bookmark className="w-3.5 h-3.5" />
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Mockup */}
            <div className="p-3.5 bg-[#F5F4F0] border-t border-[#E8E6E0] flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#77756F] cursor-pointer" />
              <input
                type="text"
                readOnly
                value="Ask follow-up: Explain the decay mechanism in the sensory buffer..."
                className="w-full bg-white text-[#292825] text-xs font-space-stitch px-3 py-2 rounded border border-[#E8E6E0] focus:outline-none"
              />
              <button className="w-8 h-8 bg-[#292825] hover:bg-[#1c1b19] text-white rounded flex items-center justify-center flex-shrink-0 transition-colors">
                <Send className="w-3.5 h-3.5 text-[#E2B85C]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
