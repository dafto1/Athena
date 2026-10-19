"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import {
  Calendar,
  Timer,
  FolderOpen,
  Edit3,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface FeatureItem {
  id: string;
  num: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  ctaText: string;
  previewType: "plan" | "focus" | "organize" | "annotate" | "collaborate";
}

const features: FeatureItem[] = [
  {
    id: "plan",
    num: "01",
    category: "Syllabus Engine",
    title: "Plan",
    tagline: "Automated syllabus matrix and semester timeline.",
    description:
      "Auto-extract dates, assignments, and exams directly from uploaded course syllabi into an organized, stress-free roadmap.",
    tag: "Dynamic Syllabus",
    ctaText: "Explore syllabus roadmap",
    previewType: "plan",
  },
  {
    id: "focus",
    num: "02",
    category: "Audio & Rhythm",
    title: "Focus",
    tagline: "Distraction-free sessions with binaural study soundscapes.",
    description:
      "Customizable Pomodoro cycles paired with curated binaural study acoustics, archival soundscapes, and stamina logging.",
    tag: "Acoustic Tracker",
    ctaText: "Preview soundscapes",
    previewType: "focus",
  },
  {
    id: "organize",
    num: "03",
    category: "Course Archives",
    title: "Organize",
    tagline: "Instant OCR indexing and structured binders.",
    description:
      "Consolidate lecture slides, notes, and past problem sets indexed cleanly by course milestone and exam urgency.",
    tag: "Instant OCR",
    ctaText: "Inspect archive vault",
    previewType: "organize",
  },
  {
    id: "annotate",
    num: "04",
    category: "Split View",
    title: "Annotate",
    tagline: "Side-by-side reading canvas and markdown sync.",
    description:
      "Read papers with bidirectional margin scribbles, color highlights, and automatic markdown notebook synchronization.",
    tag: "Split Canvas",
    ctaText: "Test PDF annotator",
    previewType: "annotate",
  },
  {
    id: "collaborate",
    num: "05",
    category: "Quiet Rooms",
    title: "Collaborate",
    tagline: "Synchronized study sprints with zero chat noise.",
    description:
      "Collaborative study lounges with real-time shared cheat sheets, synchronized timers, and zero message notification chaos.",
    tag: "Silent Cohorts",
    ctaText: "Join quiet sprint",
    previewType: "collaborate",
  },
];

export function StitchDeepStudyScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const counterCurrentRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1. THREE.JS SCHOLAR CONSTELLATION WEBGL CANVAS (SUBTLE AMBIENT DEPTH)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfaf9f6, 0.035);

    const camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Particle nodes
    const count = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cInk = new THREE.Color(0x292825);
    const cGold = new THREE.Color(0xe2b85c);
    const cTerracotta = new THREE.Color(0xb85d38);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      const r = Math.random();
      const c = r > 0.65 ? cGold : r > 0.35 ? cTerracotta : cInk;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
    });

    const particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);

    // Connecting fibers
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(count * 2 * 3);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x77756f,
      transparent: true,
      opacity: 0.08,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    let animId: number;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 1.5;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const onResize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const render = () => {
      animId = requestAnimationFrame(render);
      particles.rotation.y += 0.0006;
      particles.rotation.x += (mouseY * 0.08 - particles.rotation.x) * 0.04;
      particles.rotation.y += (mouseX * 0.08 - particles.rotation.y) * 0.04;

      // Update lines
      const pos = geometry.attributes.position.array as Float32Array;
      const lPos = lineGeo.attributes.position.array as Float32Array;
      let lIdx = 0;
      for (let i = 0; i < count && lIdx < count * 2 * 3; i++) {
        for (let j = i + 1; j < count && lIdx < count * 2 * 3; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < 25) {
            lPos[lIdx++] = pos[i * 3];
            lPos[lIdx++] = pos[i * 3 + 1];
            lPos[lIdx++] = pos[i * 3 + 2];
            lPos[lIdx++] = pos[j * 3];
            lPos[lIdx++] = pos[j * 3 + 1];
            lPos[lIdx++] = pos[j * 3 + 2];
          }
        }
      }
      lineGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      pMaterial.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    };
  }, []);

  // 2. LUXURY DECK SCROLL TIMELINE (INSPIRATION: TANISH BHAVSAR DECK MOTIONS)
  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      const intro = introRef.current;
      const topBar = topBarRef.current;
      const progressBar = progressBarRef.current;
      const counterCurrent = counterCurrentRef.current;
      const cards = cardRefs.current;

      if (!wrapper || !sticky || !intro || !topBar) return;

      // Keep the complete story available without scripted motion for people who
      // request reduced motion. The server-rendered layout is already the resting state.
      if (reduceMotion) return;

      // Query intro masked lines
      const introBadge = intro.querySelector(".intro-badge");
      const introLines = intro.querySelectorAll(".intro-line-inner");
      const introDesc = intro.querySelector(".intro-desc");
      const introPrompt = intro.querySelector(".intro-prompt");

      // Initialize states
      gsap.set(topBar, { opacity: 0, y: -20 });

      // Intro starts ready for masked line entrance
      if (introBadge) gsap.set(introBadge, { opacity: 0, y: -14, scale: 0.98 });
      if (introLines.length) gsap.set(introLines, { yPercent: 110, opacity: 0 });
      if (introDesc) gsap.set(introDesc, { opacity: 0, y: 18 });
      if (introPrompt) gsap.set(introPrompt, { opacity: 0, y: 15 });

      // Initialize each deck card for 3D zoom & masked typography reveals
      cards.forEach((card) => {
        if (card) {
          // A frame enters like a camera moving into a new plane, not like a
          // modal popping from the page. Keep the scale difference deliberately small.
          gsap.set(card, {
            opacity: 0,
            y: 56,
            z: -90,
            scale: 0.96,
            rotateX: 1.5,
            transformPerspective: 1400,
            pointerEvents: "none",
          });

          // Text lines inside start hidden beneath line masks
          const metaBadge = card.querySelector(".card-badge");
          const titleLine = card.querySelector(".card-title-line");
          const tagline = card.querySelector(".card-tagline");
          const desc = card.querySelector(".card-desc");
          const preview = card.querySelector(".card-preview");
          const cta = card.querySelector(".card-cta");

          if (metaBadge) gsap.set(metaBadge, { opacity: 0, y: 12 });
          if (titleLine) gsap.set(titleLine, { yPercent: 115, opacity: 0 });
          if (tagline) gsap.set(tagline, { yPercent: 115, opacity: 0 });
          if (desc) gsap.set(desc, { opacity: 0, y: 16 });
          if (preview) gsap.set(preview, { opacity: 0, scale: 0.97 });
          if (cta) gsap.set(cta, { opacity: 0, y: 14 });
        }
      });

      // Master ScrollTrigger timeline pinned naturally via sticky top-0
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;

            // Update progress bar width directly
            if (progressBar) {
              const pct = p < 0.10 ? 10 : Math.min(100, Math.round(10 + (p - 0.10) * 105));
              progressBar.style.width = `${pct}%`;
            }

            // Update counter directly without triggering React re-renders
            if (counterCurrent) {
              if (p < 0.10) {
                counterCurrent.textContent = "00";
              } else {
                const currentIdx = Math.min(features.length, Math.floor(((p - 0.10) / 0.90) * features.length) + 1);
                counterCurrent.textContent = `0${currentIdx}`;
              }
            }
          },
        },
      });

      // ==========================================
      // STAGE 0: INTRO ("ENGINEERED FOR DEEP STUDY")
      // ==========================================
      if (introBadge) {
        tl.to(introBadge, { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: "power2.out" });
      }
      if (introLines.length) {
        tl.to(
          introLines,
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.06,
            duration: 0.20,
            ease: "power3.out",
          },
          "-=0.08"
        );
      }
      if (introDesc) {
        tl.to(introDesc, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, "-=0.10");
      }
      if (introPrompt) {
        tl.to(introPrompt, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, "-=0.08");
      }

      // A nearly imperceptible settle gives the title life without magnifying it.
      tl.to(intro, {
        scale: 1.01,
        duration: 0.64,
        ease: "none",
      });

      // Intro zooms out & shrinks into the distance as user scrolls
      tl.to(intro, {
        opacity: 0,
        y: -42,
        z: -90,
        scale: 0.95,
        rotateX: -1.5,
        duration: 0.20,
        ease: "power2.inOut",
      });

      // Top status bar enters smoothly
      tl.to(
        topBar,
        {
          opacity: 1,
          y: 0,
          duration: 0.10,
          ease: "power2.out",
        },
        "-=0.10"
      );

      // ==========================================
      // STAGES 1 TO 6: DECK CARDS (ZOOM & REVEALS)
      // ==========================================
      const totalCards = cards.length;
      cards.forEach((card, i) => {
        if (!card) return;

        const metaBadge = card.querySelector(".card-badge");
        const titleLine = card.querySelector(".card-title-line");
        const tagline = card.querySelector(".card-tagline");
        const desc = card.querySelector(".card-desc");
        const preview = card.querySelector(".card-preview");
        const cta = card.querySelector(".card-cta");

        // 1. FRAME GLIDES INTO THE FOCAL PLANE
        tl.to(card, {
          opacity: 1,
          y: 0,
          z: 0,
          scale: 1.0,
          rotateX: 0,
          pointerEvents: "auto",
          duration: 0.34,
          ease: "power3.out",
        });

        // 2. TEXT APPEARS AS ANIMATION ON LOAD (MASKED SLIDE UP & UNBLUR)
        if (metaBadge) {
          tl.to(metaBadge, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, "-=0.20");
        }
        if (titleLine) {
          tl.to(
            titleLine,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.18,
              ease: "power3.out",
            },
            "-=0.14"
          );
        }
        if (tagline) {
          tl.to(
            tagline,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.18,
              ease: "power3.out",
            },
            "-=0.14"
          );
        }
        if (desc) {
          tl.to(
            desc,
            {
              opacity: 1,
              y: 0,
              duration: 0.16,
              ease: "power2.out",
            },
            "-=0.12"
          );
        }
        if (preview) {
          tl.to(
            preview,
            {
              opacity: 1,
              scale: 1.0,
              duration: 0.22,
              ease: "power3.out",
            },
            "-=0.18"
          );
        }
        if (cta) {
          tl.to(cta, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, "-=0.10");
        }

        // 3. Hold at a stable reading size. Scaling while reading makes the UI feel restless.
        tl.to(card, {
          scale: 1,
          duration: 0.95,
          ease: "none",
        });

        // 4. Let the outgoing frame soften into the background instead of snapping away.
        if (i < totalCards - 1) {
          tl.to(card, {
            opacity: 0,
            y: -42,
            z: -90,
            scale: 0.95,
            rotateX: -1.5,
            pointerEvents: "none",
            duration: 0.22,
            ease: "power2.inOut",
          });
        }
      });

      // Final resting hold on card 06 before releasing
      tl.to({}, { duration: 0.40 });

      return () => {
        tl.kill();
      };
    },
    { scope: wrapperRef, dependencies: [reduceMotion] }
  );

  return (
    <div
      ref={wrapperRef}
      id="features"
      className="relative w-full h-[1420vh] bg-[#F5F4F0] border-y border-[#E8E6E0]"
    >
      {/* Sticky Viewport Container (Locks perfectly to viewport without pin-spacer collisions) */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between"
      >
        {/* 3D WebGL Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
        />

        {/* Tactile notebook grid */}
        <div className="absolute inset-0 bg-grid-notebook pointer-events-none opacity-25 z-0" />

        {/* Top Sticky Header inside pinned viewport */}
        <div
          ref={topBarRef}
          className="relative z-30 px-6 lg:px-12 py-3.5 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E6E0] flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono-stitch text-xs text-[#292825] uppercase tracking-wider font-bold">
              The Scholar Toolkit
            </span>
            <span className="text-[#E8E6E0]">•</span>
            <span className="font-space-stitch text-xs text-[#77756F] hidden sm:inline-block">
              Engineered for deep study
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono-stitch text-xs text-[#77756F]">
              <span ref={counterCurrentRef} className="text-[#292825] font-bold">
                01
              </span>
              <span>/</span>
              <span>06</span>
            </div>
            <div className="w-32 h-1.5 bg-[#E8E6E0] rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-[#292825] rounded-full transition-all duration-75"
                style={{ width: "16.6%" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 1: FULL SCREEN OCCUPIED BY "ENGINEERED FOR DEEP STUDY" WITH MASKED TYPOGRAPHY */}
        <div
          ref={introRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <span className="intro-badge font-mono-stitch text-xs sm:text-sm text-[#B85D38] uppercase tracking-widest font-bold px-3.5 py-1.5 bg-[#EEE0BA]/60 rounded-full border border-[#E2B85C]/40 mb-6 inline-block shadow-2xs">
              The Scholar Toolkit
            </span>

            {/* Masked lines that slide up on scroll */}
            <h2 className="font-serif-stitch text-5xl sm:text-7xl md:text-8xl text-[#292825] font-semibold tracking-tight text-balance leading-[1.08]">
              <div className="overflow-hidden">
                <span className="intro-line-inner inline-block transform will-change-transform">
                  Engineered for
                </span>
              </div>
              <div className="overflow-hidden mt-1 sm:mt-2">
                <span className="intro-line-inner inline-block italic font-normal transform will-change-transform">
                  deep study.
                </span>
              </div>
            </h2>

            <p className="intro-desc mt-6 font-space-stitch text-base sm:text-xl text-[#77756F] max-w-2xl leading-relaxed text-balance">
              Six purpose-built modules designed to sustain focus, protect working memory, and eliminate cognitive clutter.
            </p>

            <div className="intro-prompt mt-12 flex flex-col items-center gap-2 text-[#77756F] font-mono-stitch text-xs">
              <span className="animate-pulse">Scroll down to inspect modules</span>
              <ChevronDown className="w-4 h-4 text-[#B85D38] animate-bounce" />
            </div>
          </div>
        </div>

        {/* SECTION 2: FULL SCREEN DECK FRAMES SHOWN ONE BY ONE */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-6 lg:px-12 py-6">
          <div
            className="w-full max-w-5xl mx-auto relative h-[78vh] flex items-center justify-center"
            style={{ perspective: "1500px", perspectiveOrigin: "50% 50%" }}
          >
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Tactile Deck Frame with border, shadow, and rounded geometry */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/95 backdrop-blur-md p-6 sm:p-10 rounded-2xl border border-[#E8E6E0] shadow-[0_24px_60px_rgba(41,40,37,0.09)]">
                  {/* Left Column: Description & Masked Line Typography */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="card-badge flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-[#292825] text-white flex items-center justify-center font-serif-stitch text-lg font-bold shadow-xs">
                        {feature.num}
                      </span>
                      <span className="font-mono-stitch text-xs uppercase tracking-wider bg-[#F5F4F0] text-[#77756F] px-2.5 py-1 rounded border border-[#E8E6E0] font-semibold">
                        {feature.category}
                      </span>
                    </div>

                    {/* Masked Headline Line Reveal */}
                    <div className="overflow-hidden py-0.5">
                      <h3 className="card-title-line font-serif-stitch text-3xl sm:text-4xl text-[#292825] font-semibold tracking-tight inline-block transform will-change-transform">
                        {feature.title}
                      </h3>
                    </div>

                    <div className="overflow-hidden">
                      <p className="card-tagline font-space-stitch text-sm sm:text-base text-[#292825] font-medium leading-relaxed inline-block transform will-change-transform">
                        {feature.tagline}
                      </p>
                    </div>

                    <p className="card-desc font-space-stitch text-xs sm:text-sm text-[#77756F] leading-relaxed will-change-transform">
                      {feature.description}
                    </p>

                    <div className="card-cta pt-2 flex items-center gap-4">
                      <div className="inline-flex items-center gap-1.5 font-mono-stitch text-xs text-[#292825] font-semibold group cursor-pointer hover:text-[#B85D38] transition-colors">
                        <span>{feature.ctaText}</span>
                        <ArrowRight className="w-4 h-4 text-[#E2B85C] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Realistic Interactive Tactile Preview Canvas (Deck Frame) */}
                  <div className="card-preview lg:col-span-7 bg-[#FAF9F6] rounded-xl border border-[#E8E6E0] p-5 shadow-inner">
                    {/* 01. PLAN */}
                    {feature.previewType === "plan" && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#B85D38]" />
                            <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                              Dynamic Syllabus Engine
                            </span>
                          </div>
                          <span className="font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-2 py-0.5 rounded font-bold">
                            AI Extraction Active
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="p-3 bg-white rounded border border-[#E8E6E0] flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="font-mono-stitch text-[10px] text-[#B85D38] uppercase font-bold">
                                Week 7 • Major Exam
                              </span>
                              <p className="font-serif-stitch text-sm font-semibold text-[#292825] mt-0.5">
                                Cognitive Psychology Midterm Synthesis
                              </p>
                            </div>
                            <span className="font-mono-stitch text-xs px-2 py-1 bg-[#EEE0BA] text-[#292825] rounded font-semibold">
                              Due in 4 days
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded border border-[#E8E6E0] flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="font-mono-stitch text-[10px] text-[#576055] uppercase font-bold">
                                Week 8 • Problem Set 4
                              </span>
                              <p className="font-serif-stitch text-sm font-semibold text-[#292825] mt-0.5">
                                Macroeconomics: IS-LM Equilibrium Shocks
                              </p>
                            </div>
                            <span className="font-mono-stitch text-xs px-2 py-1 bg-[#F5F4F0] text-[#77756F] rounded font-semibold">
                              Oct 24
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded border border-[#E8E6E0] flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="font-mono-stitch text-[10px] text-[#77756F] uppercase font-bold">
                                Week 9 • Lab Report II
                              </span>
                              <p className="font-serif-stitch text-sm font-semibold text-[#292825] mt-0.5">
                                Cellular Biology Spectrophotometry
                              </p>
                            </div>
                            <span className="font-mono-stitch text-xs px-2 py-1 bg-[#F5F4F0] text-[#77756F] rounded font-semibold">
                              Nov 02
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 02. FOCUS */}
                    {feature.previewType === "focus" && (
                      <div className="space-y-4 text-center py-2">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0] text-left">
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-[#B85D38]" />
                            <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                              Acoustic Pomodoro Tracker
                            </span>
                          </div>
                          <span className="font-mono-stitch text-[10px] text-[#576055] font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#576055] animate-pulse" />
                            Archival Library Audio Synced
                          </span>
                        </div>

                        <div className="py-2">
                          <div className="font-serif-stitch text-6xl font-bold text-[#292825] font-mono tabular-nums">
                            25:00
                          </div>
                          <p className="font-mono-stitch text-xs text-[#77756F] mt-1">
                            Current Focus: <span className="text-[#292825] font-semibold">Cognitive Psychology</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 h-10 py-1 bg-white rounded-lg border border-[#E8E6E0] max-w-sm mx-auto">
                          <div className="w-1.5 bg-[#576055] rounded-full wave-bar-1" />
                          <div className="w-1.5 bg-[#B85D38] rounded-full wave-bar-2" />
                          <div className="w-1.5 bg-[#E2B85C] rounded-full wave-bar-3" />
                          <div className="w-1.5 bg-[#292825] rounded-full wave-bar-4" />
                          <div className="w-1.5 bg-[#576055] rounded-full wave-bar-1" />
                          <div className="w-1.5 bg-[#B85D38] rounded-full wave-bar-3" />
                        </div>

                        <div className="flex justify-center gap-2 pt-1 font-mono-stitch text-[10px]">
                          <span className="bg-white border border-[#E8E6E0] px-2.5 py-1 rounded text-[#292825]">
                            40Hz Gamma Focus
                          </span>
                          <span className="bg-white border border-[#E8E6E0] px-2.5 py-1 rounded text-[#292825]">
                            Zero Interruption Guard
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 03. ORGANIZE */}
                    {feature.previewType === "organize" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0]">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-[#B85D38]" />
                            <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                              Course Binders & Vault Storage
                            </span>
                          </div>
                          <span className="font-mono-stitch text-[10px] text-[#77756F]">
                            1.8 / 5.0 GB used
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-white rounded border border-[#E8E6E0] space-y-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E2B85C] block" />
                            <p className="font-space-stitch text-xs font-bold text-[#292825]">
                              Cognitive Psych
                            </p>
                            <p className="font-mono-stitch text-[10px] text-[#77756F]">
                              14 files • OCR Synced
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded border border-[#E8E6E0] space-y-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#576055] block" />
                            <p className="font-space-stitch text-xs font-bold text-[#292825]">
                              Macroeconomics
                            </p>
                            <p className="font-mono-stitch text-[10px] text-[#77756F]">
                              8 files • OCR Synced
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded border border-[#E8E6E0] space-y-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#292825] block" />
                            <p className="font-space-stitch text-xs font-bold text-[#292825]">
                              Organic Chem
                            </p>
                            <p className="font-mono-stitch text-[10px] text-[#77756F]">
                              22 files • OCR Synced
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded border border-[#E8E6E0] flex items-center justify-between text-xs">
                          <span className="font-mono-stitch text-[11px] text-[#292825] font-semibold">
                            Recent OCR: Atkinson_Shiffrin_1968.pdf
                          </span>
                          <span className="font-mono-stitch text-[10px] text-[#576055] font-bold">
                            Indexed in 1.2s
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 04. ANNOTATE */}
                    {feature.previewType === "annotate" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0]">
                          <div className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-[#B85D38]" />
                            <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                              Split Canvas: PDF & Margin Notebook
                            </span>
                          </div>
                          <span className="font-mono-stitch text-[10px] bg-[#EEE0BA] text-[#292825] px-2 py-0.5 rounded font-bold">
                            Page 42 of 68
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-white rounded border border-[#E8E6E0] font-serif-stitch space-y-2">
                            <p className="font-bold text-[#292825] not-italic font-space-stitch text-xs">
                              Atkinson & Shiffrin (1968)
                            </p>
                            <p className="text-[#77756F] leading-relaxed text-[11px]">
                              &ldquo;Information transferred from the{" "}
                              <span className="bg-[#EEE0BA] text-[#292825] px-1 rounded font-semibold">
                                sensory buffer
                              </span>{" "}
                              into short-term storage undergoes elaborative encoding...&rdquo;
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded border border-[#E8E6E0] font-space-stitch space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono-stitch text-[10px] font-bold uppercase text-[#B85D38]">
                                Elena’s Margin Note
                              </span>
                              <span className="font-mono-stitch text-[9px] text-[#576055]">Saved</span>
                            </div>
                            <p className="text-[#292825] text-[11px]">
                              Key for Midterm: Selective attention acts as the gatekeeper against decay.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 05. COLLABORATE */}
                    {feature.previewType === "collaborate" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0]">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#576055]" />
                            <span className="font-mono-stitch text-xs font-bold text-[#292825]">
                              Bio 204 Cohort • Silent Sprint Lobby
                            </span>
                          </div>
                          <span className="font-mono-stitch text-[10px] bg-[#E6EAE5] text-[#576055] px-2 py-0.5 rounded font-bold">
                            4 Scholars Active
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded border border-[#E8E6E0] space-y-2 font-mono-stitch text-xs">
                          <div className="flex items-center justify-between text-[11px] text-[#77756F] pb-1 border-b border-[#E8E6E0]">
                            <span>Shared Live Cheat Sheet</span>
                            <span>Synced Audio: Archival Library</span>
                          </div>
                          <p className="text-[#292825]">
                            1. Glycolysis: Glucose → 2 Pyruvate + 2 ATP
                          </p>
                          <p className="text-[#576055] relative inline-block">
                            2. Krebs Cycle: Matrix of mitochondria; 6 NADH
                            <span className="inline-block w-0.5 h-3 bg-[#292825] animate-pulse ml-0.5" />
                          </p>
                          <p className="text-[#77756F]">
                            3. Electron Transport Chain: ATP Synthase yield
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom subtle border spacer */}
        <div className="h-6 w-full" />
      </div>
    </div>
  );
}
