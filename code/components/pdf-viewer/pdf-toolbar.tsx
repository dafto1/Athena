"use client";

import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  MousePointer2,
  StickyNote,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, IconButton, Input, ToolbarButton } from "@/components/ui";
import { MAX_ZOOM, MIN_ZOOM, type PdfTool } from "./types";

export function PdfToolbar({
  pageNumber,
  numPages,
  zoom,
  tool,
  query,
  matchLabel,
  hasDrafts,
  saving,
  onToolChange,
  onPrevPage,
  onNextPage,
  onPageInput,
  onZoomOut,
  onZoomIn,
  onQueryChange,
  onSearch,
  onPrevMatch,
  onNextMatch,
  onSave,
}: {
  pageNumber: number;
  numPages: number;
  zoom: number;
  tool: PdfTool;
  query: string;
  matchLabel: string;
  hasDrafts: boolean;
  saving: boolean;
  onToolChange: (tool: PdfTool) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageInput: (value: string) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:flex-wrap lg:items-center">
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" onClick={onPrevPage} disabled={pageNumber <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <Input
          aria-label="Page number"
          className="w-16 px-2 py-1.5 text-center"
          value={Number.isNaN(pageNumber) ? "" : pageNumber}
          onChange={(event) => onPageInput(event.target.value)}
        />
        <span className="px-1 text-sm text-slate-500">/ {numPages || "—"}</span>
        <IconButton
          label="Next page"
          onClick={onNextPage}
          disabled={numPages > 0 && pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex items-center gap-1">
        <IconButton label="Zoom out" onClick={onZoomOut} disabled={zoom <= MIN_ZOOM}>
          <ZoomOut className="h-4 w-4" />
        </IconButton>
        <span className="min-w-12 text-center text-sm font-medium text-slate-600">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton label="Zoom in" onClick={onZoomIn} disabled={zoom >= MAX_ZOOM}>
          <ZoomIn className="h-4 w-4" />
        </IconButton>
      </div>

      <form
        className="flex min-w-0 flex-1 items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search in this PDF"
          aria-label="Search in this PDF"
        />
        <Button type="submit" variant="secondary" size="sm">
          Find
        </Button>
        <IconButton label="Previous match" onClick={onPrevMatch} disabled={!matchLabel}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <IconButton label="Next match" onClick={onNextMatch} disabled={!matchLabel}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        {matchLabel && <span className="whitespace-nowrap text-xs text-slate-500">{matchLabel}</span>}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton label="Select" active={tool === "select"} onClick={() => onToolChange("select")}>
          <MousePointer2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          active={tool === "highlight"}
          onClick={() => onToolChange("highlight")}
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Note" active={tool === "note"} onClick={() => onToolChange("note")}>
          <StickyNote className="h-4 w-4" />
        </ToolbarButton>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!hasDrafts || saving}>
          {saving ? "Saving…" : "Save annotations"}
        </Button>
      </div>
    </div>
  );
}
