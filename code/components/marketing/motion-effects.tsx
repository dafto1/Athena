"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import styles from "./landing.module.css";

gsap.registerPlugin(useGSAP);
const AnimatedLink = motion.create(Link);

export function MotionPage({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function MotionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return <AnimatedLink href={href} className={className} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.18, ease: "easeOut" }}>{children}</AnimatedLink>;
}

export function AnimatedWorkspace({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(() => {
    if (reduceMotion || !scope.current) return;
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.12 });
    timeline.fromTo("[data-gsap='frame']", { autoAlpha: 0, y: 30, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.82 });
    timeline.fromTo("[data-gsap='sidebar']", { x: -12, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.42 }, "-=0.48");
    timeline.fromTo("[data-gsap='greeting']", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42 }, "-=0.35");
    timeline.fromTo("[data-gsap='task']", { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.32, stagger: 0.075 }, "-=0.18");
    timeline.fromTo("[data-gsap='focus']", { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, "-=0.36");
    timeline.fromTo("[data-gsap='resource']", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.34 }, "-=0.2");
  }, { scope, dependencies: [reduceMotion] });

  return <div ref={scope} className={styles.animatedWorkspace}>{children}</div>;
}
