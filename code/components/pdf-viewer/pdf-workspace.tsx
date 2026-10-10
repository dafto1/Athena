"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ButtonLink, Card, ErrorBanner } from "@/components/ui";
import { PdfNoteComposer } from "./pdf-note-composer";
import { PdfToolbar } from "./pdf-toolbar";
import { useAnnotations } from "./use-annotations";
import { usePdfSearch } from "./use-pdf-search";
import { usePdfViewer } from "./use-pdf-viewer";
import type { PdfAnnotation, PdfRect, PdfTool } from "./types";

const PdfDocument = dynamic(
  () => import("./pdf-document").then((mod) => mod.PdfDocument),
  { ssr: false, loading: () => <p className="p-8 text-sm text-slate-500">Loading viewer…</p> }
);

type PdfHandle = {
  numPages: number;
  getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }>;
};

export function PdfWorkspace({
  resourceId,
  title,
  fileUrl,
  initialAnnotations,
}: {
  resourceId: string;
  title: string;
  fileUrl: string;
  initialAnnotations: PdfAnnotation[];
}) {
  const [tool, setTool] = useState<PdfTool>("select");
  const [pendingNote, setPendingNote] = useState<PdfRect | null>(null);
  const pdfRef = useRef<PdfHandle | null>(null);

  const viewer = usePdfViewer();
  const annotations = useAnnotations(resourceId, initialAnnotations);
  const search = usePdfSearch(viewer.goToPage);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col items-start gap-4">
        <ButtonLink href="/dashboard/resources" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </ButtonLink>
        <h1 className="break-words text-3xl font-semibold tracking-tight text-[#37352f]">{title.replaceAll("_", " ")}</h1>
      </div>

      <PdfToolbar
        pageNumber={viewer.pageNumber}
        numPages={viewer.numPages}
        zoom={viewer.zoom}
        tool={tool}
        query={search.query}
        matchLabel={search.matchLabel}
        hasDrafts={annotations.drafts.length > 0}
        saving={annotations.saving}
        onToolChange={setTool}
        onPrevPage={() => viewer.goToPage(viewer.pageNumber - 1)}
        onNextPage={() => viewer.goToPage(viewer.pageNumber + 1)}
        onPageInput={(value) => viewer.goToPage(Number(value))}
        onZoomOut={viewer.zoomOut}
        onZoomIn={viewer.zoomIn}
        onQueryChange={search.setQuery}
        onSearch={() => {
          if (pdfRef.current) void search.searchDocument(pdfRef.current);
        }}
        onPrevMatch={search.goToPrevMatch}
        onNextMatch={search.goToNextMatch}
        onSave={() => void annotations.saveDrafts()}
      />

      {(viewer.loadError || annotations.error || search.message) && (
        <ErrorBanner
          message={viewer.loadError || annotations.error || search.message}
          onDismiss={() => {
            viewer.setLoadError("");
            annotations.setError("");
            search.setMessage("");
          }}
        />
      )}

      {annotations.drafts.length > 0 && (
        <p className="text-sm font-medium text-amber-800">
          {annotations.drafts.length} unsaved{" "}
          {annotations.drafts.length === 1 ? "annotation" : "annotations"}. Save to keep them for next time.
        </p>
      )}

      <Card className="flex justify-center overflow-auto bg-slate-100 p-4">
        <PdfDocument
          fileUrl={fileUrl}
          pageNumber={viewer.pageNumber || 1}
          zoom={viewer.zoom}
          searchQuery={search.activeQuery}
          annotations={annotations.annotations}
          tool={tool}
          selectedId={annotations.selectedId}
          onLoadSuccess={viewer.onDocumentLoadSuccess}
          onLoadError={viewer.onDocumentLoadError}
          onPdfReady={(pdf) => {
            pdfRef.current = pdf;
          }}
          onSelect={annotations.setSelectedId}
          onHighlight={(rect) => annotations.addDraft("HIGHLIGHT", viewer.pageNumber, rect, null)}
          onNote={(rect) => setPendingNote(rect)}
          onDelete={(item) => void annotations.deleteAnnotation(item)}
        />
      </Card>

      {pendingNote && (
        <PdfNoteComposer
          onCancel={() => setPendingNote(null)}
          onAdd={(content) => {
            annotations.addDraft("NOTE", viewer.pageNumber, pendingNote, content);
            setPendingNote(null);
            setTool("select");
          }}
        />
      )}
    </div>
  );
}
