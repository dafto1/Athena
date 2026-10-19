"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface FloatingShape {
  id: string;
  type: "circle" | "square" | "triangle";
  size: number;
  color: string;
  opacity: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  initialRotation?: number;
  driftX: number;
  driftY: number;
  driftRot: number;
  duration: number;
}

const floatingShapes: FloatingShape[] = [
  // Top left zone
  {
    id: "cta-shape-1",
    type: "circle",
    size: 26,
    color: "#e2b85c", // Warm gold
    opacity: 0.16,
    top: "14%",
    left: "9%",
    driftX: 20,
    driftY: -16,
    driftRot: 40,
    duration: 8.5,
  },
  {
    id: "cta-shape-2",
    type: "triangle",
    size: 22,
    color: "#d8907b", // Muted terracotta
    opacity: 0.15,
    top: "28%",
    left: "19%",
    initialRotation: 15,
    driftX: -16,
    driftY: 20,
    driftRot: -65,
    duration: 9.5,
  },
  // Bottom left zone
  {
    id: "cta-shape-3",
    type: "square",
    size: 20,
    color: "#83977d", // Muted sage
    opacity: 0.14,
    bottom: "22%",
    left: "11%",
    initialRotation: 12,
    driftX: 18,
    driftY: 16,
    driftRot: 75,
    duration: 10.5,
  },
  {
    id: "cta-shape-4",
    type: "circle",
    size: 16,
    color: "#eee0ba", // Warm ivory
    opacity: 0.18,
    bottom: "34%",
    left: "22%",
    driftX: -14,
    driftY: -14,
    driftRot: 30,
    duration: 7.5,
  },
  // Top right zone
  {
    id: "cta-shape-5",
    type: "square",
    size: 24,
    color: "#d2b263", // Warm ochre
    opacity: 0.15,
    top: "18%",
    right: "12%",
    initialRotation: 24,
    driftX: -22,
    driftY: 15,
    driftRot: -50,
    duration: 9,
  },
  {
    id: "cta-shape-6",
    type: "circle",
    size: 18,
    color: "#e2b85c", // Warm gold
    opacity: 0.17,
    top: "32%",
    right: "21%",
    driftX: 15,
    driftY: -18,
    driftRot: 45,
    duration: 8,
  },
  // Bottom right zone
  {
    id: "cta-shape-7",
    type: "triangle",
    size: 26,
    color: "#c8a54f", // Deep gold
    opacity: 0.16,
    bottom: "24%",
    right: "10%",
    initialRotation: -18,
    driftX: 16,
    driftY: -16,
    driftRot: 80,
    duration: 11,
  },
  {
    id: "cta-shape-8",
    type: "square",
    size: 18,
    color: "#d8907b", // Terracotta
    opacity: 0.13,
    bottom: "38%",
    right: "23%",
    initialRotation: 40,
    driftX: -14,
    driftY: 15,
    driftRot: -85,
    duration: 10,
  },
];

export function FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const shapesContainerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (shouldReduceMotion || !shapesContainerRef.current) return;

      floatingShapes.forEach((shape) => {
        const el = shapesContainerRef.current?.querySelector<HTMLElement>(
          `[data-shape-id="${shape.id}"]`
        );
        if (!el) return;

        gsap.to(el, {
          x: `+=${shape.driftX}`,
          y: `+=${shape.driftY}`,
          rotation: `+=${shape.driftRot}`,
          duration: shape.duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { scope: sectionRef, dependencies: [shouldReduceMotion] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#292825] py-24 sm:py-28 md:py-32 overflow-hidden text-center"
      aria-label="Call to action"
    >
      {/* Subtle animated grain/noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        aria-hidden="true"
      >
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <filter id="final-cta-noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>

        {/* Grain overlay */}
        <div
          className="absolute -inset-[50%] w-[200%] h-[200%] opacity-[0.045] mix-blend-overlay final-cta-grain"
          style={{ filter: "url(#final-cta-noise-filter)" }}
        />

        {/* Gentle warm radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(226,184,92,0.08),transparent_75%)]" />

        {/* Top border hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Decorative floating geometric shapes */}
      <div
        ref={shapesContainerRef}
        className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        {floatingShapes.map((shape) => (
          <div
            key={shape.id}
            data-shape-id={shape.id}
            style={{
              top: shape.top,
              bottom: shape.bottom,
              left: shape.left,
              right: shape.right,
              transform: shape.initialRotation
                ? `rotate(${shape.initialRotation}deg)`
                : undefined,
            }}
            className="absolute transition-opacity duration-300"
          >
            {shape.type === "circle" && (
              <div
                style={{
                  width: `${shape.size}px`,
                  height: `${shape.size}px`,
                  backgroundColor: shape.color,
                  opacity: shape.opacity,
                }}
                className="rounded-full"
              />
            )}
            {shape.type === "square" && (
              <div
                style={{
                  width: `${shape.size}px`,
                  height: `${shape.size}px`,
                  backgroundColor: shape.color,
                  opacity: shape.opacity,
                }}
                className="rounded-[4px]"
              />
            )}
            {shape.type === "triangle" && (
              <svg
                width={shape.size}
                height={shape.size}
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: shape.opacity }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="12,2 23,21 1,21" fill={shape.color} />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Main Content: Headline, Subtitle, CTA Button, Subtext */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 flex flex-col items-center">
        {/* Centered Headline */}
        <motion.h2
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold text-white tracking-[-0.03em] leading-[1.12] max-w-2xl"
        >
          Make your next study session count.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.7,
            delay: shouldReduceMotion ? 0 : 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-5 text-base sm:text-lg md:text-xl text-[#c7c3b8] max-w-xl mx-auto font-normal leading-relaxed"
        >
          Join students who study smarter with a workspace that actually works.
        </motion.p>

        {/* Primary CTA Button & Subtext */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.7,
            delay: shouldReduceMotion ? 0 : 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-10 flex flex-col items-center"
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.035 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="relative group"
          >
            {/* Ambient golden glow behind button */}
            <div
              className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-[#e2b85c]/35 via-[#f8e2a6]/50 to-[#e2b85c]/35 blur-xl opacity-45 group-hover:opacity-90 group-hover:blur-2xl transition-all duration-500 pointer-events-none"
              aria-hidden="true"
            />

            <Link
              href="/register"
              className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-9 py-4 rounded-xl font-medium text-base sm:text-lg text-[#292825] bg-gradient-to-b from-[#ffffff] via-[#fefcf8] to-[#f4edd9] border border-[#e2b85c]/70 shadow-[0_4px_24px_rgba(0,0,0,0.32),0_0_20px_rgba(226,184,92,0.25)] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.42),0_0_35px_rgba(226,184,92,0.55)] transition-all duration-300 select-none"
            >
              <span className="font-semibold tracking-tight text-[#242320]">
                Get started — it&apos;s free
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#8f6b21] transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Small text below button */}
          <p className="mt-4 text-xs sm:text-sm text-[#9c988e] font-normal tracking-wide">
            No credit card required. Free forever for students.
          </p>
        </motion.div>
      </div>

      {/* Grain animation styles */}
      <style>{`
        @keyframes ctaGrainJitter {
          0%, 100% {
            transform: translate(0, 0);
          }
          10% {
            transform: translate(-1%, -1.5%);
          }
          25% {
            transform: translate(1.5%, 0.5%);
          }
          40% {
            transform: translate(-0.5%, 1.5%);
          }
          55% {
            transform: translate(1%, -1%);
          }
          70% {
            transform: translate(-1.5%, 0%);
          }
          85% {
            transform: translate(0.5%, -1%);
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .final-cta-grain {
            animation: ctaGrainJitter 8s steps(10) infinite;
          }
        }
      `}</style>
    </section>
  );
}

export const FinalCTA = FinalCta;
export default FinalCta;
