"use client";

import { useCallback, useState } from "react";
import type { PdfAnnotation, PdfRect, AnnotationType } from "./types";
import { HIGHLIGHT_COLOR, NOTE_COLOR } from "./types";

function fromServer(raw: Omit<PdfAnnotation, "persisted">): PdfAnnotation {
  return { ...raw, persisted: true };
}

export function useAnnotations(resourceId: string, initial: PdfAnnotation[]) {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const drafts = annotations.filter((item) => !item.persisted);

  const addDraft = useCallback(
    (type: AnnotationType, pageNumber: number, rect: PdfRect, content: string | null) => {
      const annotation: PdfAnnotation = {
        id: crypto.randomUUID(),
        persisted: false,
        type,
        pageNumber,
        content,
        color: type === "NOTE" ? NOTE_COLOR : HIGHLIGHT_COLOR,
        ...rect,
      };
      setAnnotations((current) => [...current, annotation]);
      setSelectedId(annotation.id);
    },
    []
  );

  const removeLocal = useCallback((id: string) => {
    setAnnotations((current) => current.filter((item) => item.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const saveDrafts = useCallback(async () => {
    if (drafts.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/resources/${resourceId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: drafts.map(({ type, pageNumber, content, color, xPct, yPct, wPct, hPct }) => ({
            type,
            pageNumber,
            content,
            color,
            xPct,
            yPct,
            wPct,
            hPct,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not save annotations.");
        return;
      }
      const saved = (data as Omit<PdfAnnotation, "persisted">[]).map(fromServer);
      setAnnotations((current) => [
        ...current.filter((item) => item.persisted),
        ...saved,
      ]);
      setSelectedId(null);
    } catch {
      setError("Network error: could not save annotations.");
    } finally {
      setSaving(false);
    }
  }, [drafts, resourceId]);

  const deleteAnnotation = useCallback(
    async (annotation: PdfAnnotation) => {
      if (!annotation.persisted) {
        removeLocal(annotation.id);
        return;
      }
      setError("");
      const response = await fetch(`/api/annotations/${annotation.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Could not delete the annotation.");
        return;
      }
      removeLocal(annotation.id);
    },
    [removeLocal]
  );

  return {
    annotations,
    drafts,
    selectedId,
    setSelectedId,
    error,
    setError,
    saving,
    addDraft,
    saveDrafts,
    deleteAnnotation,
  };
}
