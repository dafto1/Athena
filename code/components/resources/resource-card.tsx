// Single resource card (REQ-RES-004, REQ-RES-006, REQ-RES-007)
"use client";

import { useState } from "react";
import { Badge, IconButton } from "@/components/ui";
import {
  FileText,
  FileCode,
  FileImage,
  Presentation,
  Download,
  Trash2,
  Edit2,
  Calendar,
} from "lucide-react";
import { formatBytes, type Resource } from "./types";

function getFileIcon(type: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || type.includes("pdf")) return FileText;
  if (ext === "ppt" || ext === "pptx" || type.includes("presentation")) return Presentation;
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || type.includes("image")) return FileImage;
  if (ext === "md" || ext === "txt") return FileCode;
  return FileText;
}

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
}: {
  resource: Resource;
  onEdit: (r: Resource) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const Icon = getFileIcon(resource.fileType, resource.fileName);

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(resource.id);
      }
    } finally {
      setDeleting(false);
    }
  }

  const formattedDate = new Date(resource.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="violet">{resource.category}</Badge>
        </div>

        <h3 className="mt-3.5 text-base font-semibold text-slate-900 line-clamp-1" title={resource.title}>
          {resource.title}
        </h3>

        <p className="mt-1 text-xs text-slate-500 line-clamp-1" title={resource.fileName}>
          {resource.fileName}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{formatBytes(resource.fileSize)}</span>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={resource.fileUrl}
            download={resource.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Download / View"
          >
            <Download className="h-4 w-4" />
          </a>
          <IconButton label="Edit details" onClick={() => onEdit(resource)}>
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Delete resource"
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
