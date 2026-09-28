import JSZip from "jszip";

/* ---------------- helpers ---------------- */

export function sanitizeName(s: string): string {
  const clean = s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  return clean || "image";
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

export function cellNames(
  base: string,
  cols: number,
  rows: number,
  ext: string,
): string[] {
  const total = cols * rows;
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
  void total;
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
  trim: number; // % of each side
  scale: number; // multiplier
  format: "png" | "jpeg";
  quality: number;
  onProgress?: (p: number) => void;
}

export interface CutOutput {
  thumbs: string[];
  blobs: Blob[];
  mime: string;
  ext: string;
  outW: number;
  outH: number;
}

export async function cutGrid(opts: CutOptions): Promise<CutOutput> {
  const { img, cols, rows, trim, scale, format, quality, onProgress } = opts;
  const t = Math.min(0.45, Math.max(0, trim) / 100);
  const x0 = img.width * t;
  const y0 = img.height * t;
  const iw = img.width * (1 - 2 * t);
  const ih = img.height * (1 - 2 * t);
  const cw = iw / cols;
  const ch = ih / rows;
  const outW = Math.max(1, Math.round(cw * scale));
  const outH = Math.max(1, Math.round(ch * scale));
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";

  const thumbs: string[] = new Array(cols * rows);
  const blobs: Blob[] = new Array(cols * rows);
  const total = cols * rows;
  let i = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = x0 + c * cw;
      const sy = y0 + r * ch;
      const cv = document.createElement("canvas");
      cv.width = outW;
      cv.height = outH;
      const cx = cv.getContext("2d");
      if (!cx) throw new Error("Canvas 2D not supported");
      if (format === "jpeg") {
        cx.fillStyle = "#ffffff";
        cx.fillRect(0, 0, outW, outH);
      }
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(img, sx, sy, cw, ch, 0, 0, outW, outH);

      // small preview thumbnail
      const TH = 128;
      const ts = Math.min(TH / outW, TH / outH, 1);
      const tw = Math.max(1, Math.round(outW * ts));
      const th = Math.max(1, Math.round(outH * ts));
      const tcv = document.createElement("canvas");
      tcv.width = tw;
      tcv.height = th;
      const tctx = tcv.getContext("2d");
      if (tctx) {
        tctx.drawImage(cv, 0, 0, tw, th);
        thumbs[i] = tcv.toDataURL("image/png");
      } else {
        thumbs[i] = "";
      }

      const blob: Blob = await new Promise((res, rej) =>
        cv.toBlob(
          (b) => (b ? res(b) : rej(new Error("Encoding failed"))),
          mime,
          quality,
        ),
      );
      blobs[i] = blob;
      i++;
      if (i % 16 === 0 || i === total) {
        onProgress?.(i / total);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }

  return { thumbs, blobs, mime, ext, outW, outH };
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
    zip.generateAsync(
      { type: "blob", compression: "STORE" },
      (meta) => onPct?.(meta.percent / 100),
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
  // RAR is a proprietary format with no browser encoder; we ship a fully
  // compatible archive instead and surface this to the user in the UI.
  return `${sanitizeName(base)}${format === "rar" ? ".zip" : ".zip"}`;
}
