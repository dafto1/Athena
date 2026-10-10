// Group shared resource card (REQ-GROUP-006, REQ-GROUP-007, REQ-GROUP-010)
"use client";

import { useState } from "react";
import { Badge, IconButton, IconLink } from "@/components/ui";
import {
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileType2,
  Presentation,
  Download,
  Trash2,
  BookOpen,
  User,
  Folder,
} from "lucide-react";
import { isPdfFile } from "@/lib/files";
import { formatBytes } from "@/components/resources/types";
import type { GroupResourceItem, GroupRole } from "./types";

function getFileIcon(type: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || type.includes("pdf")) return FileText;
  if (ext === "ppt" || ext === "pptx" || type.includes("presentation")) return Presentation;
  if (ext === "xlsx" || ext === "xls" || ext === "csv" || type.includes("spreadsheet")) return FileSpreadsheet;
  if (ext === "doc" || ext === "docx" || type.includes("word")) return FileType2;
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || type.includes("image")) return FileImage;
  if (ext === "md" || ext === "txt") return FileCode;
  return FileText;
}

export function GroupResourceCard({
  item,
  currentUserId,
  userRole,
  onRemoved,
}: {
  item: GroupResourceItem;
  currentUserId: string;
  userRole?: GroupRole;
  onRemoved: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const Icon = getFileIcon(item.resource.fileType, item.resource.fileName);

  // REQ-GROUP-010: Only uploader or group ADMIN can remove
  const canRemove = item.sharedById === currentUserId || userRole === "ADMIN";

  async function handleRemove() {
    if (!window.confirm(`Remove "${item.resource.title}" from this study group?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${item.groupId}/resources/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) onRemoved(item.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-stone-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <Badge variant="violet">{item.resource.category}</Badge>
            {item.folder && (
              <Badge variant="slate">
                <Folder className="h-3 w-3 mr-0.5 inline" />
                {item.folder.name}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="mt-3.5 text-base font-semibold text-slate-900 line-clamp-1" title={item.resource.title}>
          {item.resource.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.resource.fileName}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>Shared by {item.sharedBy.name || item.sharedBy.email.split("@")[0]}</span>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between">
        <span className="text-xs text-slate-400">{formatBytes(item.resource.fileSize)}</span>

        <div className="flex items-center gap-1">
          {isPdfFile(item.resource.fileType, item.resource.fileName) && (
            <IconLink href={`/dashboard/resources/${item.resource.id}`} label="Open PDF in Athena">
              <BookOpen className="h-4 w-4" />
            </IconLink>
          )}
          <IconLink
            href={`/api/resources/${item.resource.id}/file`}
            label="Download resource"
            download={item.resource.fileName}
            external
          >
            <Download className="h-4 w-4" />
          </IconLink>
          {canRemove && (
            <IconButton
              label="Remove from group"
              variant="danger"
              onClick={handleRemove}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
