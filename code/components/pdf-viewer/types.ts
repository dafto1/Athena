export type AnnotationType = "HIGHLIGHT" | "NOTE";

export type PdfTool = "select" | "highlight" | "note";

export type PdfAnnotation = {
  id: string;
  persisted: boolean;
  type: AnnotationType;
  pageNumber: number;
  content: string | null;
  color: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

export type PdfRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 0.25;
export const DEFAULT_ZOOM = 1;
export const HIGHLIGHT_COLOR = "#facc15";
export const NOTE_COLOR = "#38bdf8";
