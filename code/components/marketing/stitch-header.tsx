"use client";

import Link from "next/link";
import { User } from "lucide-react";

export function StitchHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E6E0] shadow-[0_1px_6px_rgba(41,40,37,0.03)] transition-colors">
      <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#292825] flex items-center justify-center text-[#E2B85C] font-serif-stitch font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-serif-stitch text-xl font-bold tracking-tight text-[#292825]">
              Athena
            </span>
          </Link>
          <span className="font-mono-stitch text-[11px] uppercase tracking-wider px-2 py-0.5 bg-[#F5F4F0] text-[#77756F] rounded border border-[#E8E6E0] ml-1 font-medium hidden sm:inline-block">
            Study Workspace
          </span>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-8 font-space-stitch">
          <a
            href="#features"
            className="text-sm text-[#77756F] hover:text-[#292825] transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-[#77756F] hover:text-[#292825] transition-colors font-medium"
          >
            How it works
          </a>
          <a
            href="#nemo-ai"
            className="text-sm text-[#77756F] hover:text-[#292825] transition-colors font-medium"
          >
            Nemo AI
          </a>
          <a
            href="#study-groups"
            className="text-sm text-[#77756F] hover:text-[#292825] transition-colors font-medium"
          >
            Study Groups
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-4 font-space-stitch">
          <Link
            href="/login"
            className="text-sm text-[#77756F] hover:text-[#292825] transition-colors font-medium px-2 py-1"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-[#292825] text-white font-medium text-sm inline-flex items-center gap-2 hover:bg-[#1c1b19] hover:ring-1 hover:ring-[#E2B85C]/50 shadow-sm transition-all"
          >
            <span>Get started</span>
            <User className="w-4 h-4 text-[#E2B85C]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
