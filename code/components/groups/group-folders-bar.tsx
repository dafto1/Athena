"use client";

import { Button } from "@/components/ui";
import { Folder, Users, Share2 } from "lucide-react";
import type { StudyGroupFolder } from "./types";

export function GroupFoldersBar({
  folders,
  selectedFolderId,
  onSelectFolder,
  memberCount,
  onMembers,
  onShare,
}: {
  folders: StudyGroupFolder[];
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  memberCount: number;
  onMembers: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
      <button onClick={() => onSelectFolder("all")} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${selectedFolderId === "all" ? "bg-[#f1f0ed] text-[#37352f]" : "text-slate-600 hover:bg-slate-50"}`}>
        <Folder className="h-4 w-4" /> All resources
      </button>
      <Button variant="secondary" size="sm" onClick={onMembers}><Users className="h-4 w-4" /> Members ({memberCount})</Button>
      <Button variant="secondary" size="sm" onClick={onShare}><Share2 className="h-4 w-4" /> Share resource</Button>
      {folders.map((folder) => (
        <button key={folder.id} onClick={() => onSelectFolder(folder.id)} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${selectedFolderId === folder.id ? "bg-[#f1f0ed] text-[#37352f]" : "text-slate-600 hover:bg-slate-50"}`}>
          <Folder className="h-4 w-4" /> {folder.name}
          {typeof folder._count?.resources === "number" && <span className="text-xs text-slate-400">{folder._count.resources}</span>}
        </button>
      ))}
    </div>
  );
}
