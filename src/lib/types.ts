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

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
