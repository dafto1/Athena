// Study group summary card (REQ-GROUP-001 - REQ-GROUP-004)
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, IconButton } from "@/components/ui";
import { Users, BookOpen, Copy, Check } from "lucide-react";
import type { StudyGroup } from "./types";

export function GroupCard({ group }: { group: StudyGroup }) {
  const [copied, setCopied] = useState(false);

  function copyInvite() {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-[#fbfbfa]">
      <Link href={`/dashboard/groups/${group.id}`} aria-label={`Open ${group.name}`} className="absolute inset-0 z-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" />
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold text-slate-900 line-clamp-1">{group.name}</h3>
        <div className="relative z-20 flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono text-slate-600">
          <span>{group.inviteCode}</span>
          <IconButton label="Copy invite code" onClick={copyInvite} className="p-0.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </IconButton>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-stone-500" />
            {group._count?.members ?? 1} {group._count?.members === 1 ? "member" : "members"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            {group._count?.resources ?? 0} {group._count?.resources === 1 ? "resource" : "resources"}
          </span>
        </div>

        <Badge variant="slate">{group.role === "ADMIN" ? "Admin" : "Member"}</Badge>
      </div>
    </div>
  );
}
