export type JobStatus = "loading" | "idle" | "cutting" | "done" | "error";
export type OutFormat = "png" | "jpeg";

export type LayoutMode = "uniform" | "free" | "freeform";

export interface CutCell {
  name: string;
  thumb: string;
  w: number;
  h: number;
}

export const GRID_MIN = 1;
export const GRID_MAX = 100;
export const SCALE_MIN = 0.25;
export const SCALE_MAX = 10;
export const RECT_MIN = 0.04;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

/* ---------------- divider helpers ---------------- */

export function evenPositions(n: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => i / n);
}

export function normalizePositions(
  pos: number[] | null | undefined,
  n: number,
): number[] {
  if (!pos || pos.length !== n + 1 || n < 1) return evenPositions(n);
  const arr = pos.slice();
  arr[0] = 0;
  arr[n] = 1;
  for (let i = 0; i <= n; i++) {
    if (!Number.isFinite(arr[i])) return evenPositions(n);
    if (i > 0 && !(arr[i] > arr[i - 1])) return evenPositions(n);
  }
  return arr;
}

/* ---------------- freeform rectangle helpers ---------------- */

/** Rectangle stored in normalized image coordinates (0..1). */
export interface FreeRect {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function sanitizeRect(
  src: { id?: string; name?: string; x: number; y: number; w: number; h: number },
): FreeRect {
  const x = clamp(src.x, 0, 1);
  const y = clamp(src.y, 0, 1);
  const w = clamp(src.w, RECT_MIN, 1 - x);
  const h = clamp(src.h, RECT_MIN, 1 - y);
  return {
    id: src.id ?? uid(),
    name: src.name ?? "",
    x,
    y,
    w,
    h,
  };
}

export function rectIntersects(a: FreeRect, b: FreeRect): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export interface Job {
  id: string;
  name: string;
  url: string;
  img: HTMLImageElement | null;
  imgW: number;
  imgH: number;
  cols: number;
  rows: number;
  /** Layout mode for this card */
  layout: LayoutMode;
  /** uniform/free mode: column dividers (length cols+1, fractions). */
  colPos: number[] | null;
  /** uniform/free mode: row dividers (length rows+1, fractions). */
  rowPos: number[] | null;
  /** freeform mode: arbitrary rectangles (may overlap). */
  overlays: FreeRect[];
  trim: number; // percentage of each side removed (0..10)
  scale: number; // output multiplier 0.25..10
  format: OutFormat;
  quality: number; // jpeg quality 0.5..1
  status: JobStatus;
  progress: number; // 0..1
  cells: CutCell[] | null;
  blobs: Blob[] | null;
  outW: number;
  outH: number;
  error?: string;
}
