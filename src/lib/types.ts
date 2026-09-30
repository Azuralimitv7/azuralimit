export type JobStatus = "loading" | "idle" | "cutting" | "done" | "error";
export type OutFormat = "png" | "jpeg";

export interface CutCell {
  name: string;
  thumb: string;
  w: number;
  h: number;
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
  /** custom column divider fractions (length cols+1, 0..1). null = evenly spaced */
  colPos: number[] | null;
  /** custom row divider fractions (length rows+1, 0..1). null = evenly spaced */
  rowPos: number[] | null;
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

export const GRID_MIN = 1;
export const GRID_MAX = 100;
export const SCALE_MIN = 0.25;
export const SCALE_MAX = 10;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Evenly spaced divider fractions for n divisions (n+1 entries, 0..1). */
export function evenPositions(n: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => i / n);
}

/**
 * Normalizes a stored divider array: must have n+1 finite entries, start at 0,
 * end at 1 and strictly increase. Falls back to evenly spaced otherwise.
 */
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

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
