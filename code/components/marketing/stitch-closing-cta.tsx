"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export function StitchClosingCta() {
  return (
    <section className="w-full py-20 px-6 lg:px-12 bg-[#F5F4F0] border-t border-[#E8E6E0] relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-matrix pointer-events-none opacity-20" />
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-2xl border border-[#E8E6E0] shadow-md text-center flex flex-col items-center relative z-10">
        {/* Scholar Seal Badge */}
        <div className="w-16 h-16 rounded-full bg-[#EEE0BA] border border-[#E2B85C] text-[#292825] flex items-center justify-center mb-6 shadow-sm">
          <BookOpen className="w-8 h-8 text-[#B85D38]" />
        </div>

        <h2 className="font-serif-stitch text-3xl md:text-5xl text-[#292825] font-semibold max-w-xl text-balance">
          Spend less time wrangling apps and more time{" "}
          <span className="italic text-[#292825]">truly learning.</span>
        </h2>

        <p className="mt-4 font-space-stitch text-sm md:text-base text-[#77756F] max-w-lg leading-relaxed text-balance">
          Join scholars and students who replaced digital noise with calm, structured study routines.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#292825] hover:bg-[#1c1b19] text-white font-mono-stitch text-xs font-semibold rounded transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group hover:ring-1 hover:ring-[#E2B85C]/60"
          >
            <span>Get started free</span>
            <ArrowRight className="w-4 h-4 text-[#E2B85C] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
