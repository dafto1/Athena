"use client";

import { useCallback, useState } from "react";
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./types";

export function usePdfViewer() {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [loadError, setLoadError] = useState("");

  const onDocumentLoadSuccess = useCallback(({ numPages: next }: { numPages: number }) => {
    setNumPages(next);
    setPageNumber(1);
    setLoadError("");
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes("password")) {
      setLoadError("This PDF is password-protected and cannot be opened in Athena.");
      return;
    }
    setLoadError("This PDF could not be opened or processed. The file may be damaged or unsupported.");
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (numPages < 1) return;
      setPageNumber(Math.min(numPages, Math.max(1, Math.round(page))));
    },
    [numPages]
  );

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  }, []);

  return {
    numPages,
    pageNumber,
    zoom,
    loadError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    goToPage,
    zoomIn,
    zoomOut,
    setLoadError,
  };
}
