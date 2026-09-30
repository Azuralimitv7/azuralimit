import JSZip from "jszip";
import {
  drawRegionHighRes,
  encodeCanvasResilient,
  resolveSafeCellSize,
} from "./encoder";
import { normalizePositions } from "./types";

/* ---------------- helpers ---------------- */

export function sanitizeName(s: string): string {
  const clean = s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  return clean || "image";
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        if ("decode" in img && typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        /* ignore decode hint errors, onload already succeeded */
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error("Gambar tidak dapat didekode"));
    img.src = src;
  });
}

export function cellNames(
  base: string,
  cols: number,
  rows: number,
  ext: string,
): string[] {
  const padR = String(rows).length;
  const padC = String(cols).length;
  const out: string[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      out.push(
        `${base}_row${String(r).padStart(padR, "0")}_col${String(c).padStart(padC, "0")}.${ext}`,
      );
    }
  }
  return out;
}

export function fmtBytes(n: number): string {
  if (!isFinite(n) || n < 0) return "0 B";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let v = n / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[u]}`;
}

/* ---------------- cutting ---------------- */

export interface CutOptions {
  img: HTMLImageElement;
  cols: number;
  rows: number;
  /** custom divider fractions (cols+1 entries). null = evenly spaced */
  colPos?: number[] | null;
  /** custom divider fractions (rows+1 entries). null = evenly spaced */
  rowPos?: number[] | null;
  trim: number; // % of each side
  scale: number; // multiplier
  format: "png" | "jpeg";
  quality: number;
  onProgress?: (p: number) => void;
}

export interface CellSize {
  w: number;
  h: number;
}

export interface CutOutput {
  thumbs: string[];
  blobs: Blob[];
  sizes: CellSize[];
  mime: string;
  ext: string;
  outW: number;
  outH: number;
  clamped: boolean;
  effectiveScale: number;
}

export async function cutGrid(opts: CutOptions): Promise<CutOutput> {
  const {
    img,
    cols,
    rows,
    colPos,
    rowPos,
    trim,
    scale,
    format,
    quality,
    onProgress,
  } = opts;
  const t = Math.min(0.45, Math.max(0, trim) / 100);
  const x0 = img.width * t;
  const y0 = img.height * t;
  const iw = img.width * (1 - 2 * t);
  const ih = img.height * (1 - 2 * t);

  // Divider fractions — custom (user-dragged) or evenly spaced
  const colP = normalizePositions(colPos, cols);
  const rowP = normalizePositions(rowPos, rows);

  const mime = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";

  const total = cols * rows;
  const thumbs: string[] = new Array(total);
  const blobs: Blob[] = new Array(total);
  const sizes: CellSize[] = new Array(total);

  // Reusable canvas pool (prevents GPU backing-store exhaustion across cells)
  const workCanvas = document.createElement("canvas");
  const stepCanvas = document.createElement("canvas");
  const thumbCanvas = document.createElement("canvas");
  const tctx = thumbCanvas.getContext("2d");

  const TH = 128;
  let clampedAny = false;
  let effectiveScale = scale;
  let firstW = 0;
  let firstH = 0;

  let i = 0;
  try {
    for (let r = 0; r < rows; r++) {
      const sy = y0 + rowP[r] * ih;
      const sh = (rowP[r + 1] - rowP[r]) * ih;
      for (let c = 0; c < cols; c++) {
        const sx = x0 + colP[c] * iw;
        const sw = (colP[c + 1] - colP[c]) * iw;

        // Per-cell safe output size (cells may differ when grid was dragged)
        const safe = resolveSafeCellSize(sw, sh, scale);
        if (safe.clamped) clampedAny = true;
        effectiveScale = safe.effectiveScale;
        let cellW = safe.outW;
        let cellH = safe.outH;

        if (workCanvas.width !== cellW || workCanvas.height !== cellH) {
          workCanvas.width = cellW;
          workCanvas.height = cellH;
        }
        const cx = workCanvas.getContext("2d");
        if (!cx) throw new Error("Canvas 2D tidak didukung di browser ini");

        drawRegionHighRes(
          cx,
          img,
          sx,
          sy,
          sw,
          sh,
          cellW,
          cellH,
          format,
          stepCanvas,
        );

        // Lightweight preview thumbnail for the first 64 cells
        if (tctx && i < 64) {
          const ts = Math.min(TH / cellW, TH / cellH, 1);
          const tw = Math.max(1, Math.round(cellW * ts));
          const th = Math.max(1, Math.round(cellH * ts));
          if (thumbCanvas.width !== tw || thumbCanvas.height !== th) {
            thumbCanvas.width = tw;
            thumbCanvas.height = th;
          }
          tctx.clearRect(0, 0, tw, th);
          tctx.imageSmoothingEnabled = true;
          tctx.imageSmoothingQuality = "high";
          tctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
          try {
            thumbs[i] = thumbCanvas.toDataURL("image/jpeg", 0.82);
          } catch {
            thumbs[i] = "";
          }
        } else {
          thumbs[i] = "";
        }

        const encoded = await encodeCanvasResilient(
          workCanvas,
          img,
          sx,
          sy,
          sw,
          sh,
          mime,
          quality,
          format,
        );

        blobs[i] = encoded.blob;
        cellW = encoded.actualW;
        cellH = encoded.actualH;
        sizes[i] = { w: cellW, h: cellH };
        if (i === 0) {
          firstW = cellW;
          firstH = cellH;
        }

        i++;
        const heavy = cellW * cellH >= 400_000;
        if (i % (heavy ? 1 : 12) === 0 || i === total) {
          onProgress?.(i / total);
          await new Promise((res) => setTimeout(res, 0));
        }
      }
    }
  } finally {
    // Explicitly release GPU canvas memory immediately
    workCanvas.width = 1;
    workCanvas.height = 1;
    stepCanvas.width = 1;
    stepCanvas.height = 1;
    thumbCanvas.width = 1;
    thumbCanvas.height = 1;
  }

  return {
    thumbs,
    blobs,
    sizes,
    mime,
    ext,
    outW: firstW,
    outH: firstH,
    clamped: clampedAny,
    effectiveScale,
  };
}

/* ---------------- archives ---------------- */

export interface ZipEntry {
  name: string;
  blob: Blob;
}

export async function packZip(
  folders: { name: string; entries: ZipEntry[] }[],
  onPct?: (p: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  for (const f of folders) {
    const root = f.name ? zip.folder(f.name) ?? zip : zip;
    for (const e of f.entries) root.file(e.name, e.blob);
  }
  return new Promise((resolve, reject) => {
    zip
      .generateAsync({ type: "blob", compression: "STORE" }, (meta) =>
        onPct?.(meta.percent / 100),
      )
      .then(resolve)
      .catch(reject);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function archiveNameFor(base: string, format: "zip" | "rar"): string {
  return `${sanitizeName(base)}${format === "rar" ? ".zip" : ".zip"}`;
}
