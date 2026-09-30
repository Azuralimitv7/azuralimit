/* ============================================================
   AZURALIMIT — Resilient High-Resolution Canvas & PNG Encoder
   Prevents "Encoding failed" when upscaling cells (up to 5000x5000+ px)
   across desktop & mobile browsers on Vercel.
   ============================================================ */

export interface SafeSizeResult {
  outW: number;
  outH: number;
  effectiveScale: number;
  clamped: boolean;
}

/**
 * Maximum safe per-cell pixel limits so browsers never reject canvas allocation
 * or return `null` from `canvas.toBlob()`.
 * - 6000x6000 (36 MP) easily covers the 5000x5000 px target while staying
 *   within Chromium/Firefox/WebKit 2D canvas backing-store limits.
 */
export const MAX_CELL_DIMENSION = 6000;
export const MAX_CELL_AREA = 36_000_000; // 6000 * 6000 pixels

/**
 * Computes safe output dimensions for a sliced cell while preserving aspect ratio.
 */
export function resolveSafeCellSize(
  srcCellW: number,
  srcCellH: number,
  requestedScale: number,
): SafeSizeResult {
  const rawW = Math.max(1, Math.round(srcCellW * requestedScale));
  const rawH = Math.max(1, Math.round(srcCellH * requestedScale));

  let ratio = 1;
  if (rawW > MAX_CELL_DIMENSION) {
    ratio = Math.min(ratio, MAX_CELL_DIMENSION / rawW);
  }
  if (rawH > MAX_CELL_DIMENSION) {
    ratio = Math.min(ratio, MAX_CELL_DIMENSION / rawH);
  }
  const area = rawW * rawH;
  if (area > MAX_CELL_AREA) {
    ratio = Math.min(ratio, Math.sqrt(MAX_CELL_AREA / area));
  }

  if (ratio < 1) {
    const outW = Math.max(1, Math.floor(rawW * ratio));
    const outH = Math.max(1, Math.floor(rawH * ratio));
    return {
      outW,
      outH,
      effectiveScale: Number(((outW / Math.max(1, srcCellW))).toFixed(2)),
      clamped: true,
    };
  }

  return {
    outW: rawW,
    outH: rawH,
    effectiveScale: requestedScale,
    clamped: false,
  };
}

/**
 * Draws a source image region onto a target canvas using progressive 2x stepping
 * when upscaling heavily, avoiding GPU single-pass interpolation failures.
 */
export function drawRegionHighRes(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  outW: number,
  outH: number,
  format: "png" | "jpeg",
  stepCanvas?: HTMLCanvasElement,
) {
  ctx.clearRect(0, 0, outW, outH);
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // If upscaling by more than 2.5x and a step canvas is available, do a 2-stage upscale
  const scaleX = outW / Math.max(1, sw);
  const scaleY = outH / Math.max(1, sh);
  if (stepCanvas && (scaleX > 2.5 || scaleY > 2.5) && outW * outH <= 25_000_000) {
    const midW = Math.max(1, Math.round(Math.sqrt(sw * outW)));
    const midH = Math.max(1, Math.round(Math.sqrt(sh * outH)));
    stepCanvas.width = midW;
    stepCanvas.height = midH;
    const sctx = stepCanvas.getContext("2d");
    if (sctx) {
      if (format === "jpeg") {
        sctx.fillStyle = "#ffffff";
        sctx.fillRect(0, 0, midW, midH);
      }
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, midW, midH);
      ctx.drawImage(stepCanvas, 0, 0, midW, midH, 0, 0, outW, outH);
      // Free intermediate backing store immediately
      stepCanvas.width = 1;
      stepCanvas.height = 1;
      return;
    }
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
}

/**
 * Converts a `data:...;base64,...` URL into a Blob without using `fetch`.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) throw new Error("Invalid data URL");
  const header = dataUrl.slice(0, commaIdx);
  const base64 = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";

  const binStr = atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/* ---------------- Pure-TypeScript PNG Encoder Fallback ---------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  let i = 0;
  const len = buf.length;
  while (i < len) {
    const end = Math.min(i + 5550, len);
    for (; i < end; i++) {
      a += buf[i];
      b += a;
    }
    a %= MOD;
    b %= MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function writeU32BE(out: Uint8Array, offset: number, val: number) {
  out[offset] = (val >>> 24) & 0xff;
  out[offset + 1] = (val >>> 16) & 0xff;
  out[offset + 2] = (val >>> 8) & 0xff;
  out[offset + 3] = val & 0xff;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeU32BE(chunk, 0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  writeU32BE(chunk, 8 + data.length, crc);
  return chunk;
}

/**
 * Pure-JS uncompressed PNG encoder from raw RGBA ImageData.
 * Used as an ultimate guarantee if browser `toBlob` and `toDataURL` both fail.
 */
export function encodeImageDataToPngBlob(
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): Blob {
  const rowLen = width * 4 + 1;
  const raw = new Uint8Array(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // Filter type 0 (None)
    const srcStart = y * width * 4;
    raw.set(rgba.subarray(srcStart, srcStart + width * 4), rowStart + 1);
  }

  // Wrap raw scanlines in Zlib Stored Deflate blocks (65535 bytes max per block)
  const BLOCK_SIZE = 65535;
  const numBlocks = Math.max(1, Math.ceil(raw.length / BLOCK_SIZE));
  const zlibLen = 2 + raw.length + numBlocks * 5 + 4;
  const zlib = new Uint8Array(zlibLen);
  zlib[0] = 0x78; // CMF
  zlib[1] = 0x01; // FLG (no compression / lowest overhead)

  let zOff = 2;
  let rOff = 0;
  for (let b = 0; b < numBlocks; b++) {
    const isLast = b === numBlocks - 1;
    const len = Math.min(BLOCK_SIZE, raw.length - rOff);
    const nlen = ~len & 0xffff;
    zlib[zOff++] = isLast ? 0x01 : 0x00;
    zlib[zOff++] = len & 0xff;
    zlib[zOff++] = (len >>> 8) & 0xff;
    zlib[zOff++] = nlen & 0xff;
    zlib[zOff++] = (nlen >>> 8) & 0xff;
    zlib.set(raw.subarray(rOff, rOff + len), zOff);
    zOff += len;
    rOff += len;
  }
  writeU32BE(zlib, zOff, adler32(raw));

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const cIHDR = makePngChunk("IHDR", ihdr);
  const cIDAT = makePngChunk("IDAT", zlib);
  const cIEND = makePngChunk("IEND", new Uint8Array(0));

  return new Blob([sig.buffer as ArrayBuffer, cIHDR.buffer as ArrayBuffer, cIDAT.buffer as ArrayBuffer, cIEND.buffer as ArrayBuffer], {
    type: "image/png",
  });
}

/**
 * Multi-stage resilient canvas encoder:
 * 1. Native `canvas.toBlob(mime, quality)`
 * 2. Fallback `canvas.toDataURL(mime, quality)` -> `Blob`
 * 3. Progressive step-down retry if browser rejects the canvas size during encoding
 * 4. Pure-JS `ImageData -> PNG Blob` encoder as final guarantee
 */
export async function encodeCanvasResilient(
  cv: HTMLCanvasElement,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  mime: string,
  quality: number,
  format: "png" | "jpeg",
): Promise<{ blob: Blob; actualW: number; actualH: number }> {
  // Stage 1: Try native toBlob at current canvas size
  const tryToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
    new Promise((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), mime, quality);
      } catch {
        resolve(null);
      }
    });

  let blob = await tryToBlob(cv);
  if (blob && blob.size > 0) {
    return { blob, actualW: cv.width, actualH: cv.height };
  }

  // Stage 2: Try toDataURL fallback at current canvas size
  try {
    const dataUrl = cv.toDataURL(mime, quality);
    if (dataUrl && dataUrl.startsWith("data:image/")) {
      blob = dataUrlToBlob(dataUrl);
      if (blob.size > 0) {
        return { blob, actualW: cv.width, actualH: cv.height };
      }
    }
  } catch {
    /* proceed to stage 3 */
  }

  // Stage 3: Browser hit a GPU/canvas encoding ceiling — step down resolution gracefully
  const startW = cv.width;
  const startH = cv.height;
  for (const factor of [0.75, 0.5, 0.35]) {
    const nextW = Math.max(1, Math.round(startW * factor));
    const nextH = Math.max(1, Math.round(startH * factor));
    cv.width = nextW;
    cv.height = nextH;
    const ctx = cv.getContext("2d");
    if (!ctx) continue;
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, nextW, nextH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, nextW, nextH);

    blob = await tryToBlob(cv);
    if (blob && blob.size > 0) {
      return { blob, actualW: nextW, actualH: nextH };
    }
    try {
      const dataUrl = cv.toDataURL(mime, quality);
      if (dataUrl && dataUrl.startsWith("data:image/")) {
        blob = dataUrlToBlob(dataUrl);
        if (blob.size > 0) {
          return { blob, actualW: nextW, actualH: nextH };
        }
      }
    } catch {
      /* continue */
    }
  }

  // Stage 4: Ultimate software PNG encoder via getImageData
  const ctx = cv.getContext("2d");
  if (ctx) {
    const w = cv.width;
    const h = cv.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const fallbackBlob = encodeImageDataToPngBlob(w, h, imgData.data);
    return { blob: fallbackBlob, actualW: w, actualH: h };
  }

  throw new Error("Tidak dapat mengenkode gambar pada perangkat ini");
}
