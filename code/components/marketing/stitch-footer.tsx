"use client";

import Link from "next/link";

export function StitchFooter() {
  return (
    <footer className="w-full bg-[#F5F4F0] border-t border-[#E8E6E0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-serif-stitch text-xl font-bold text-[#292825]">
                Athena
              </span>
              <span className="font-mono-stitch text-[10px] px-2 py-0.5 bg-white text-[#77756F] rounded border border-[#E8E6E0] font-semibold uppercase">
                Disciplined Workspace
              </span>
            </div>
            <p className="font-space-stitch text-xs text-[#77756F] max-w-sm leading-relaxed">
              A deliberate digital environment designed for focused scholarship, deep study, and structured archival learning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-space-stitch text-xs font-medium">
            <a href="#features" className="text-[#77756F] hover:text-[#292825] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[#77756F] hover:text-[#292825] transition-colors">
              How it works
            </a>
            <a href="#nemo-ai" className="text-[#77756F] hover:text-[#292825] transition-colors">
              Nemo AI
            </a>
            <a href="#study-groups" className="text-[#77756F] hover:text-[#292825] transition-colors">
              Study Groups
            </a>
            <Link href="/login" className="text-[#77756F] hover:text-[#292825] transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E6E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono-stitch text-[#77756F]">
          <span>© {new Date().getFullYear()} Athena Research & Learning Tools. All rights reserved.</span>
          <span>Crafted for deep work & archival precision</span>
        </div>
      </div>
    </footer>
  );
}
