// Study group summary card (REQ-GROUP-001 - REQ-GROUP-004)
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, IconButton } from "@/components/ui";
import { Users, BookOpen, Copy, Check, ArrowRight } from "lucide-react";
import type { StudyGroup } from "./types";

export function GroupCard({ group }: { group: StudyGroup }) {
  const [copied, setCopied] = useState(false);

  function copyInvite() {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Badge variant={group.role === "ADMIN" ? "violet" : "slate"}>
            {group.role === "ADMIN" ? "Admin" : "Member"}
          </Badge>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs font-mono text-slate-600 border border-slate-200">
            <span>Code: {group.inviteCode}</span>
            <IconButton label="Copy invite code" onClick={copyInvite} className="p-0.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </IconButton>
          </div>
        </div>

        <h3 className="mt-3.5 text-base font-semibold text-slate-900 line-clamp-1">
          {group.name}
        </h3>

        {group.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {group.description}
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-violet-500" />
            {group._count?.members ?? 1} {group._count?.members === 1 ? "member" : "members"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            {group._count?.resources ?? 0} {group._count?.resources === 1 ? "resource" : "resources"}
          </span>
        </div>

        <Link
          href={`/dashboard/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
