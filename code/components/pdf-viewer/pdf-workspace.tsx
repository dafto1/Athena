"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowLeft, PanelRightOpen } from "lucide-react";
import { ButtonLink, Card, ErrorBanner } from "@/components/ui";
import { PdfNoteComposer } from "./pdf-note-composer";
import { PdfToolbar } from "./pdf-toolbar";
import { useAnnotations } from "./use-annotations";
import { usePdfSearch } from "./use-pdf-search";
import { usePdfViewer } from "./use-pdf-viewer";
import type { PdfAnnotation, PdfRect, PdfTool } from "./types";
import { NemoWorkspace } from "@/components/nemo/nemo-workspace";

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
  const [nemoOpen, setNemoOpen] = useState(true);
  const pdfRef = useRef<PdfHandle | null>(null);

  const viewer = usePdfViewer();
  const annotations = useAnnotations(resourceId, initialAnnotations);
  const search = usePdfSearch(viewer.goToPage);

  return (
    <div className="mx-auto w-full max-w-[1760px] space-y-4 px-4 pb-8 xl:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ButtonLink href="/dashboard/resources" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </ButtonLink>
        <h1 className="min-w-0 break-words text-xl font-semibold tracking-tight text-[#37352f] sm:text-2xl">{title.replaceAll("_", " ")}</h1>
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

      <div className={`grid min-w-0 items-start gap-4 ${nemoOpen ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.34fr)] 2xl:grid-cols-[minmax(0,1fr)_380px]" : "xl:grid-cols-[minmax(0,1fr)_44px]"}`}>
        <Card className="flex min-h-[calc(100dvh-190px)] min-w-0 justify-center overflow-auto bg-[#f2f1ee] p-3 sm:p-5">
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
        <div id="pdf-nemo-sidebar" className={nemoOpen ? "min-w-0" : "min-w-0 justify-self-stretch xl:sticky xl:top-4 xl:w-11"}>
          {nemoOpen ? (
            <Card className="h-[min(68dvh,640px)] min-h-[360px] overflow-hidden border-[#e9e8e4] bg-[#fffefd] p-0 shadow-sm xl:h-[calc(100dvh-7rem)] xl:min-h-[420px]">
              <NemoWorkspace key={resourceId} compact resourceContext={{ resourceId, title: title.replaceAll("_", " ") }} onCollapse={() => setNemoOpen(false)} />
            </Card>
          ) : (
            <button
              type="button"
              aria-label="Expand Nemo sidebar"
              aria-expanded={false}
              onClick={() => setNemoOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e9e8e4] bg-white px-3 text-sm font-medium text-[#5f5e5b] transition hover:bg-[#f7f6f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a06b30] xl:h-32 xl:flex-col xl:px-0"
            >
              <PanelRightOpen className="h-4 w-4 shrink-0" />
              <span className="xl:[writing-mode:vertical-rl] xl:rotate-180">Nemo</span>
            </button>
          )}
        </div>
      </div>

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
