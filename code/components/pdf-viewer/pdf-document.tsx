"use client";

import { useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PdfAnnotationLayer } from "./pdf-annotation-layer";
import type { PdfAnnotation, PdfRect, PdfTool } from "./types";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const pdfOptions = {
  cMapUrl: "/pdfjs/cmaps/",
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function PdfDocument({
  fileUrl,
  pageNumber,
  zoom,
  searchQuery,
  annotations,
  tool,
  selectedId,
  onLoadSuccess,
  onLoadError,
  onPdfReady,
  onSelect,
  onHighlight,
  onNote,
  onDelete,
}: {
  fileUrl: string;
  pageNumber: number;
  zoom: number;
  searchQuery: string;
  annotations: PdfAnnotation[];
  tool: PdfTool;
  selectedId: string | null;
  onLoadSuccess: (info: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  onPdfReady: (pdf: { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }) => void;
  onSelect: (id: string | null) => void;
  onHighlight: (rect: PdfRect) => void;
  onNote: (rect: PdfRect) => void;
  onDelete: (annotation: PdfAnnotation) => void;
}) {
  const customTextRenderer = useMemo(() => {
    const term = searchQuery.trim();
    if (!term) return undefined;
    const pattern = new RegExp(`(${escapeRegExp(term)})`, "gi");
    return ({ str }: { str: string }) =>
      str.replace(pattern, (match) => `<mark>${match}</mark>`);
  }, [searchQuery]);

  return (
    <Document
      file={fileUrl}
      options={pdfOptions}
      suspense={false}
      loading={<p className="p-8 text-sm text-slate-500">Opening PDF…</p>}
      error={<p className="p-8 text-sm text-rose-700">The PDF could not be rendered.</p>}
      onLoadSuccess={(pdf) => {
        onLoadSuccess({ numPages: pdf.numPages });
        onPdfReady(pdf);
      }}
      onLoadError={onLoadError}
    >
      <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Page
          pageNumber={pageNumber}
          scale={zoom}
          width={720}
          renderAnnotationLayer
          renderTextLayer
          customTextRenderer={customTextRenderer}
          loading={<p className="p-8 text-sm text-slate-500">Rendering page…</p>}
        />
        <PdfAnnotationLayer
          pageNumber={pageNumber}
          annotations={annotations}
          tool={tool}
          selectedId={selectedId}
          onSelect={onSelect}
          onHighlight={onHighlight}
          onNote={onNote}
          onDelete={onDelete}
        />
      </div>
    </Document>
  );
}
