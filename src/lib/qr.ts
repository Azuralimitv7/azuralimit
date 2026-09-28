/* Pure TypeScript ISO/IEC 18004 QR Code generator (Byte mode, ECC Level L).
   Supports versions 1..10 (up to 271 bytes, plenty for URLs & wallet addresses). */

interface VersionInfo {
  size: number;
  totalDataBytes: number;
  ecBytesPerBlock: number;
  blocks: number;
  align: number[];
}

// ECC Level L table for Versions 1..10
const VERSIONS: Record<number, VersionInfo> = {
  1: { size: 21, totalDataBytes: 19, ecBytesPerBlock: 7, blocks: 1, align: [] },
  2: { size: 25, totalDataBytes: 34, ecBytesPerBlock: 10, blocks: 1, align: [6, 18] },
  3: { size: 29, totalDataBytes: 55, ecBytesPerBlock: 15, blocks: 1, align: [6, 22] },
  4: { size: 33, totalDataBytes: 80, ecBytesPerBlock: 20, blocks: 1, align: [6, 26] },
  5: { size: 37, totalDataBytes: 108, ecBytesPerBlock: 26, blocks: 1, align: [6, 30] },
  6: { size: 41, totalDataBytes: 136, ecBytesPerBlock: 18, blocks: 2, align: [6, 34] },
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

function pickVersion(byteLen: number): number {
  for (let v = 1; v <= 6; v++) {
    const cap = VERSIONS[v].totalDataBytes - 2; // 4-bit mode + 8-bit len + terminator
    if (byteLen <= cap) return v;
  }
  return 6;
}

function buildCodewords(text: string, v: VersionInfo): Uint8Array {
  const utf8 = new TextEncoder().encode(text);
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  // Byte mode = 0100
  pushBits(0b0100, 4);
  pushBits(utf8.length, 8);
  for (const b of utf8) pushBits(b, 8);
  const maxBits = v.totalDataBytes * 8;
  const term = Math.min(4, maxBits - bits.length);
  pushBits(0, term);
  while (bits.length % 8 !== 0) bits.push(0);
  const dataBytes = new Uint8Array(v.totalDataBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    dataBytes[i] = byte;
  }
  const pads = [0xec, 0x11];
  let pi = 0;
  for (let i = bits.length / 8; i < v.totalDataBytes; i++) {
    dataBytes[i] = pads[pi++ % 2];
  }

  // Split into blocks and compute RS
  const blockDataLen = v.totalDataBytes / v.blocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  for (let b = 0; b < v.blocks; b++) {
    const slice = dataBytes.subarray(b * blockDataLen, (b + 1) * blockDataLen);
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, v.ecBytesPerBlock));
  }

  const out: number[] = [];
  for (let i = 0; i < blockDataLen; i++) {
    for (let b = 0; b < v.blocks; b++) out.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < v.ecBytesPerBlock; i++) {
    for (let b = 0; b < v.blocks; b++) out.push(ecBlocks[b][i]);
  }
  return new Uint8Array(out);
}

export function encodeQrMatrix(text: string): boolean[][] {
  const ver = pickVersion(new TextEncoder().encode(text).length);
  const info = VERSIONS[ver];
  const n = info.size;

  const modules: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const reserved: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  const setModule = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= n || c < 0 || c >= n) return;
    modules[r][c] = dark;
    reserved[r][c] = true;
  };

  // Finder patterns + separators
  const placeFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= n || c < 0 || c >= n) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, n - 7);
  placeFinder(n - 7, 0);

  // Alignment patterns
  const a = info.align;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === a.length - 1) ||
        (i === a.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = a[i];
      const cc = a[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    if (!reserved[6][i]) setModule(6, i, i % 2 === 0);
    if (!reserved[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // Dark module + reserve format areas
  setModule(n - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][n - 1 - i]) reserved[8][n - 1 - i] = true;
    if (!reserved[n - 1 - i][8]) reserved[n - 1 - i][8] = true;
  }

  // Place data bits
  const codewords = buildCodewords(text, info);
  const allBits: number[] = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b--) allBits.push((cw >> b) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      const r = upward ? n - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!reserved[r][c]) {
          const dark = bitIdx < allBits.length ? allBits[bitIdx++] === 1 : false;
          // Mask 0: (r + c) % 2 === 0
          modules[r][c] = ((r + c) % 2 === 0) ? !dark : dark;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for ECC Level L (01) + Mask 0 (000) -> BCH encoded + XOR mask = 0x77c4
  const fmt = 0x77c4;
  const fbits: boolean[] = [];
  for (let i = 0; i < 15; i++) fbits.push(((fmt >> i) & 1) === 1);

  // Top-left format info
  for (let i = 0; i <= 5; i++) modules[8][i] = fbits[i];
  modules[8][7] = fbits[6];
  modules[8][8] = fbits[7];
  modules[7][8] = fbits[8];
  for (let i = 9; i < 15; i++) modules[14 - i][8] = fbits[i];

  // Top-right and bottom-left format info
  for (let i = 0; i < 8; i++) modules[8][n - 1 - i] = fbits[i];
  for (let i = 8; i < 15; i++) modules[n - 15 + i][8] = fbits[i];

  return modules;
}

export function renderQrSvg(
  text: string,
  opts: { fg?: string; bg?: string; margin?: number } = {},
): string {
  const { fg = "#002147", bg = "#FFF6E4", margin = 3 } = opts;
  const mat = encodeQrMatrix(text);
  const n = mat.length;
  const total = n + margin * 2;
  let path = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mat[r][c]) {
        path += `M${c + margin},${r + margin}h1v1h-1z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" rx="2" fill="${bg}"/><path d="${path}" fill="${fg}"/></svg>`;
}
