"use client";

import { useRef, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { PdfAnnotation, PdfRect, PdfTool } from "./types";

function percentRect(start: { x: number; y: number }, current: { x: number; y: number }): PdfRect {
  const xPct = Math.max(0, Math.min(start.x, current.x));
  const yPct = Math.max(0, Math.min(start.y, current.y));
  const wPct = Math.min(100, Math.abs(current.x - start.x));
  const hPct = Math.min(100, Math.abs(current.y - start.y));
  return { xPct, yPct, wPct, hPct };
}

function toPct(event: React.PointerEvent<HTMLDivElement>, box: DOMRect) {
  return {
    x: Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)),
    y: Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100)),
  };
}

export function PdfAnnotationLayer({
  pageNumber,
  annotations,
  tool,
  selectedId,
  onSelect,
  onHighlight,
  onNote,
  onDelete,
}: {
  pageNumber: number;
  annotations: PdfAnnotation[];
  tool: PdfTool;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHighlight: (rect: PdfRect) => void;
  onNote: (rect: PdfRect) => void;
  onDelete: (annotation: PdfAnnotation) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<PdfRect | null>(null);
  const drawing = tool === "highlight" || tool === "note";

  const pageAnnotations = annotations.filter((item) => item.pageNumber === pageNumber);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing || !layerRef.current) return;
    if ((event.target as HTMLElement).closest("[data-annotation]")) return;
    const point = toPct(event, layerRef.current.getBoundingClientRect());
    dragStart.current = point;
    setDraftRect({ xPct: point.x, yPct: point.y, wPct: 0, hPct: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing || !dragStart.current || !layerRef.current) return;
    setDraftRect(percentRect(dragStart.current, toPct(event, layerRef.current.getBoundingClientRect())));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing || !dragStart.current || !layerRef.current) return;
    const rect = percentRect(dragStart.current, toPct(event, layerRef.current.getBoundingClientRect()));
    dragStart.current = null;
    setDraftRect(null);

    if (tool === "note") {
      onNote({ xPct: rect.xPct, yPct: rect.yPct, wPct: 0, hPct: 0 });
      return;
    }
    if (rect.wPct < 1 || rect.hPct < 0.6) return;
    onHighlight(rect);
  }

  return (
    <div
      ref={layerRef}
      className={`absolute inset-0 ${drawing ? "cursor-crosshair" : "pointer-events-none"}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {pageAnnotations.map((annotation) => {
        const selected = selectedId === annotation.id;
        if (annotation.type === "NOTE") {
          return (
            <div
              key={annotation.id}
              data-annotation
              className="pointer-events-auto absolute z-10"
              style={{ left: `${annotation.xPct}%`, top: `${annotation.yPct}%` }}
            >
              <button
                type="button"
                className="rounded-full bg-sky-500 p-1.5 text-white shadow hover:bg-sky-600"
                onClick={() => onSelect(selected ? null : annotation.id)}
                aria-label={annotation.content ?? "Note"}
              >
                <StickyNote className="h-3.5 w-3.5" />
              </button>
              {selected && (
                <div className="absolute left-8 top-0 z-20 w-56 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg">
                  <p className="text-sm text-slate-800">{annotation.content || "Note"}</p>
                  {!annotation.persisted && (
                    <p className="mt-1 text-xs font-medium text-amber-700">Unsaved</p>
                  )}
                  <IconButton
                    label="Delete note"
                    variant="danger"
                    className="mt-2"
                    onClick={() => onDelete(annotation)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={annotation.id}
            data-annotation
            className={`pointer-events-auto absolute rounded-sm border ${
              selected ? "border-violet-600" : "border-amber-300"
            }`}
            style={{
              left: `${annotation.xPct}%`,
              top: `${annotation.yPct}%`,
              width: `${annotation.wPct}%`,
              height: `${annotation.hPct}%`,
              backgroundColor: `${annotation.color}66`,
            }}
          >
            <button
              type="button"
              className="h-full w-full"
              aria-label="Highlight"
              onClick={() => onSelect(selected ? null : annotation.id)}
            />
            {selected && (
              <span className="absolute -right-2 -top-2">
                <IconButton
                  label="Delete highlight"
                  variant="danger"
                  className="bg-white shadow"
                  onClick={() => onDelete(annotation)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </span>
            )}
          </div>
        );
      })}

      {draftRect && tool === "highlight" && (
        <div
          className="pointer-events-none absolute rounded-sm bg-amber-300/50"
          style={{
            left: `${draftRect.xPct}%`,
            top: `${draftRect.yPct}%`,
            width: `${draftRect.wPct}%`,
            height: `${draftRect.hPct}%`,
          }}
        />
      )}
    </div>
  );
}
