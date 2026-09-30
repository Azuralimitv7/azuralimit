"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import {
  GRID_MAX,
  SCALE_MAX,
  SCALE_MIN,
  clamp,
  normalizePositions,
} from "@/lib/types";
import { fmtBytes } from "@/lib/cut";
import { resolveSafeCellSize } from "@/lib/encoder";
import { sfx } from "@/lib/sound";
import { toast } from "./Toasts";
import {
  IconBox,
  IconGrid,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconScissors,
  IconSpinner,
  IconSync,
  IconTrash,
  IconWarn,
  IconX,
} from "./Icons";

const PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 16, 25, 50, 100];
const SCALE_CHIPS = [0.5, 1, 2, 4, 5, 10];
const MAX_THUMBS = 48;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 6;

interface Props {
  index: number;
  job: Job;
  onUpdate: (id: string, patch: Partial<Job>) => void;
  onRemove: (id: string) => void;
  onCut: (id: string) => void;
  onDownload: (id: string) => void;
  onSyncGrid: (id: string) => void;
  onOpenCell: (id: string, idx: number) => void;
  onReset: (id: string) => void;
  packing: boolean;
  refCb: (el: HTMLElement | null) => void;
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const step = (d: number) => {
    sfx.tick();
    onChange(clamp(value + d, 1, GRID_MAX));
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="az-label w-12">{label}</span>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= 1}
        className="az-icon-btn h-8 w-8"
        aria-label={`Kurangi ${label}`}
      >
        <IconMinus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={1}
        max={GRID_MAX}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(clamp(v, 1, GRID_MAX));
        }}
        className="az-input az-num h-8 w-14 text-center font-mono text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= GRID_MAX}
        className="az-icon-btn h-8 w-8"
        aria-label={`Tambah ${label}`}
      >
        <IconPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------------- draggable grid drag state ---------------- */

type DragState =
  | { kind: "col"; idx: number; startX: number; colP0: number[]; rowP0: number[] }
  | { kind: "row"; idx: number; startY: number; colP0: number[]; rowP0: number[] }
  | {
      kind: "block";
      c: number;
      r: number;
      startX: number;
      startY: number;
      colP0: number[];
      rowP0: number[];
    }
  | null;

export default function JobCard(props: Props) {
  const { job, index } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);

  const [cont, setCont] = useState({ w: 800, h: 270 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<{ c: number; r: number; fx: number; fy: number } | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [flash, setFlash] = useState(false);

  const total = job.cols * job.rows;
  const t = Math.min(0.45, Math.max(0, trim0(job.trim)));
  const iw = job.imgW * (1 - 2 * t);
  const ih = job.imgH * (1 - 2 * t);

  /* divider fractions (custom-dragged or evenly spaced) */
  const colP = useMemo(() => normalizePositions(job.colPos, job.cols), [job.colPos, job.cols]);
  const rowP = useMemo(() => normalizePositions(job.rowPos, job.rows), [job.rowPos, job.rows]);
  const customGrid = Boolean(job.colPos || job.rowPos);

  /* size estimate for the first block (cells may vary after dragging) */
  const sw0 = (colP[1] - colP[0]) * iw;
  const sh0 = (rowP[1] - rowP[0]) * ih;
  const safeSize = resolveSafeCellSize(
    Math.max(0.001, sw0),
    Math.max(0.001, sh0),
    job.scale,
  );
  const outW = job.imgW ? safeSize.outW : 1;
  const outH = job.imgH ? safeSize.outH : 1;
  const baseCW = job.imgW ? Math.round(sw0) : 0;
  const baseCH = job.imgH ? Math.round(sh0) : 0;

  /* ---------- container measurement + fitted display size ---------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setCont((prev) =>
        Math.abs(prev.w - r.width) > 1 || Math.abs(prev.h - r.height) > 1
          ? { w: r.width, h: r.height }
          : prev,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const fit = useMemo(() => {
    if (!job.imgW || !job.imgH) return 1;
    return Math.min((cont.w - 30) / job.imgW, (cont.h - 30) / job.imgH, 1);
  }, [cont, job.imgW, job.imgH]);

  const dispW = Math.max(48, Math.round(job.imgW * fit * zoom));
  const dispH = Math.max(48, Math.round(job.imgH * fit * zoom));

  /* ---------- ctrl/meta + wheel zoom (non-passive listener) ---------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0016);
      setZoom((z) => clamp(z * factor, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const setZoomStep = (dir: 1 | -1) => {
    sfx.tick();
    setZoom((z) => clamp(Number((z * (dir === 1 ? 1.35 : 1 / 1.35)).toFixed(3)), ZOOM_MIN, ZOOM_MAX));
  };

  /* ---------- draggable grid: pointer handlers ---------- */

  const splitPos = (pos: number[], n: number, f: number) => {
    let idx = 0;
    for (let i = 0; i < n; i++) if (f >= pos[i]) idx = i;
    return idx;
  };

  const onOverlayDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!job.img || job.status === "cutting") return;
    const ov = overlayRef.current;
    if (!ov) return;
    const rect = ov.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;

    e.preventDefault();
    ov.setPointerCapture(e.pointerId);

    const minGx = 8 / Math.max(1, rect.width);
    const minGy = 8 / Math.max(1, rect.height);
    const colP0 = [...colP];
    const rowP0 = [...rowP];

    // nearest vertical divider (skip in very dense grids where handles overlap)
    let colHit = -1;
    if (job.cols <= 60) {
      const tol = Math.min(minGx * 1.6, (1 / job.cols) * 0.45);
      let best = tol;
      for (let i = 1; i < job.cols; i++) {
        const d = Math.abs(fx - colP0[i]);
        if (d < best) {
          best = d;
          colHit = i;
        }
      }
    }
    // nearest horizontal divider
    let rowHit = -1;
    if (job.rows <= 60) {
      const tol = Math.min(minGy * 1.6, (1 / job.rows) * 0.45);
      let best = tol;
      for (let i = 1; i < job.rows; i++) {
        const d = Math.abs(fy - rowP0[i]);
        if (d < best) {
          best = d;
          rowHit = i;
        }
      }
    }

    if (colHit > 0 || rowHit > 0) {
      dragRef.current =
        colHit > 0
          ? { kind: "col", idx: colHit, startX: e.clientX, colP0, rowP0 }
          : { kind: "row", idx: rowHit, startY: e.clientY, colP0, rowP0 };
    } else {
      const c = splitPos(colP0, job.cols, fx);
      const r = splitPos(rowP0, job.rows, fy);
      dragRef.current = {
        kind: "block",
        c,
        r,
        startX: e.clientX,
        startY: e.clientY,
        colP0,
        rowP0,
      };
    }
    setDragging(true);
    sfx.tick();
  };

  const onOverlayMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ov = overlayRef.current;
    const st = dragRef.current;
    if (!ov) return;
    const rect = ov.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;

    if (!st) {
      if (job.img && job.status !== "cutting" && fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
        const c = splitPos(colP, job.cols, fx);
        const r = splitPos(rowP, job.rows, fy);
        setHover((h) => (h && h.c === c && h.r === r && h.fx === fx && h.fy === fy ? h : { c, r, fx, fy }));
      }
      return;
    }

    e.preventDefault();
    const minGx = 8 / Math.max(1, rect.width);
    const minGy = 8 / Math.max(1, rect.height);

    if (st.kind === "col") {
      const dx = (e.clientX - st.startX) / rect.width;
      const next = [...st.colP0];
      next[st.idx] = clamp(
        st.colP0[st.idx] + dx,
        st.colP0[st.idx - 1] + minGx,
        st.colP0[st.idx + 1] - minGx,
      );
      props.onUpdate(job.id, { colPos: next });
    } else if (st.kind === "row") {
      const dy = (e.clientY - st.startY) / rect.height;
      const next = [...st.rowP0];
      next[st.idx] = clamp(
        st.rowP0[st.idx] + dy,
        st.rowP0[st.idx - 1] + minGy,
        st.rowP0[st.idx + 1] - minGy,
      );
      props.onUpdate(job.id, { rowPos: next });
    } else {
      const dx = (e.clientX - st.startX) / rect.width;
      const dy = (e.clientY - st.startY) / rect.height;
      const c = st.c;
      const r = st.r;

      // slide the whole block horizontally (both dividers move together)
      const nextCol = [...st.colP0];
      const w = st.colP0[c + 1] - st.colP0[c];
      const loX = c > 0 ? st.colP0[c - 1] + minGx : 0;
      const hiX = (c < job.cols - 1 ? st.colP0[c + 2] - minGx : 1) - w;
      const leftX = clamp(st.colP0[c] + dx, loX, Math.max(loX, hiX));
      nextCol[c] = leftX;
      nextCol[c + 1] = leftX + w;

      // slide the whole block vertically
      const nextRow = [...st.rowP0];
      const h = st.rowP0[r + 1] - st.rowP0[r];
      const loY = r > 0 ? st.rowP0[r - 1] + minGy : 0;
      const hiY = (r < job.rows - 1 ? st.rowP0[r + 2] - minGy : 1) - h;
      const topY = clamp(st.rowP0[r] + dy, loY, Math.max(loY, hiY));
      nextRow[r] = topY;
      nextRow[r + 1] = topY + h;

      props.onUpdate(job.id, { colPos: nextCol, rowPos: nextRow });
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      try {
        overlayRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      sfx.tick();
    }
  };

  /* ---------- misc ---------- */

  const setScale = (v: number) => {
    props.onUpdate(job.id, { scale: clamp(Math.round(v * 100) / 100, SCALE_MIN, SCALE_MAX) });
  };

  const scalePct = ((job.scale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  const trimPct = (job.trim / 10) * 100;

  const shown = useMemo(
    () => (job.cells ? job.cells.slice(0, MAX_THUMBS) : []),
    [job.cells],
  );

  const bigGrid = total > 4000;
  const cutting = job.status === "cutting";
  const done = job.status === "done";
  const showHandles = job.cols <= 40 && job.rows <= 40;

  /* hovered block size readout */
  const hoverSize = useMemo(() => {
    if (!hover || !job.imgW) return null;
    const sw = (colP[hover.c + 1] - colP[hover.c]) * iw;
    const sh = (rowP[hover.r + 1] - rowP[hover.r]) * ih;
    const s = resolveSafeCellSize(Math.max(0.001, sw), Math.max(0.001, sh), job.scale);
    return { w: s.outW, h: s.outH, sw: Math.round(sw), sh: Math.round(sh) };
  }, [hover, colP, rowP, iw, ih, job.scale, job.imgW]);

  return (
    <article
      ref={props.refCb}
      className={`az-card relative flex flex-col overflow-hidden ${cutting ? "az-shake" : ""}`}
    >
      {/* Top technical sheet strip */}
      <div className="az-ruler-strip flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-strong)] px-3.5 py-2 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="border border-[var(--line-strong)] bg-[var(--accent)] px-1.5 py-0.5 font-bold text-[var(--on-accent)]">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <span className="az-num font-bold text-[var(--ink)]">
            {job.cols}×{job.rows} GRID ({total.toLocaleString()} KEPING)
          </span>
          {job.imgW > 0 && (
            <span className="az-num text-[var(--ink-faint)]">
              · ASLI {job.imgW}×{job.imgH}px
            </span>
          )}
          {customGrid && (
            <span className="border border-[var(--accent-line)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink)]">
              POSISI KUSTOM
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {done && (
            <span className="az-pop az-badge-ok az-num px-2 py-0.5 text-[10px] font-bold">
              SELESAI · {outW}×{outH}px
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              sfx.snap();
              setShowNumbers((v) => !v);
            }}
            disabled={total > 360}
            title="Tampilkan nomor urut keping"
            className={`az-icon-btn h-7 w-7 ${showNumbers ? "az-icon-btn-on" : ""}`}
          >
            <IconGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.pop(3);
              props.onRemove(job.id);
            }}
            title="Hapus lembar ini"
            className="az-icon-btn h-7 w-7"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------- cutting stage (scroll + zoom + draggable grid) ---------------- */}
      <div className="relative h-[270px] border-b border-[var(--line-strong)]">
        {/* corner registration marks */}
        <span className="pointer-events-none absolute left-2 top-1.5 z-10 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute right-2 top-1.5 z-10 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute bottom-1.5 left-2 z-10 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute bottom-1.5 right-2 z-10 font-mono text-xs text-[var(--ink-soft)]">+</span>

        <div ref={scrollRef} className="az-checker az-scroll h-full w-full overflow-auto">
          <div className="flex min-h-full min-w-full">
            <div
              ref={stageRef}
              className="relative shrink-0"
              style={{ width: job.img ? dispW : 240, height: job.img ? dispH : 200, margin: "auto" }}
            >
              {job.img ? (
                <img
                  src={job.url}
                  alt={job.name}
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                  style={{ filter: "drop-shadow(3px 3px 0 var(--shadow-hard))" }}
                  onDoubleClick={() => {
                    sfx.tick();
                    setZoom((z) => (z > 1.05 ? 1 : 2.5));
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center gap-2 font-mono text-xs text-[var(--ink-soft)]">
                  <IconSpinner className="az-spin h-6 w-6" />
                  <span>MEMBACA GAMBAR…</span>
                </div>
              )}

              {/* ---- draggable grid overlay ---- */}
              {job.img && job.status !== "cutting" && (
                <div
                  ref={overlayRef}
                  onPointerDown={onOverlayDown}
                  onPointerMove={onOverlayMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onPointerLeave={() => setHover(null)}
                  className="absolute inset-0 z-[5] touch-none select-none"
                  style={{ cursor: dragging ? "grabbing" : "crosshair" }}
                  role="presentation"
                >
                  <div
                    className="pointer-events-none absolute inset-0 border-2"
                    style={{ borderColor: "var(--grid-line)" }}
                  />

                  {/* vertical dividers + handles */}
                  {job.cols > 1 &&
                    colP.slice(1, -1).map((f, i) => (
                      <div
                        key={`v${i}`}
                        className="pointer-events-none absolute top-0 bottom-0 flex -translate-x-1/2 items-center justify-center"
                        style={{ left: `${f * 100}%`, width: showHandles ? 16 : 4 }}
                      >
                        <div
                          className="h-full w-[1.5px]"
                          style={{
                            background: "var(--grid-line)",
                            opacity: dragging && !showHandles ? 1 : 0.9,
                          }}
                        />
                        {showHandles && (
                          <div
                            className="absolute h-3 w-3 rotate-45 border-2 bg-[var(--menu)]"
                            style={{ borderColor: "var(--accent)" }}
                          />
                        )}
                      </div>
                    ))}

                  {/* horizontal dividers + handles */}
                  {job.rows > 1 &&
                    rowP.slice(1, -1).map((f, i) => (
                      <div
                        key={`h${i}`}
                        className="pointer-events-none absolute left-0 right-0 flex -translate-y-1/2 items-center justify-center"
                        style={{ top: `${f * 100}%`, height: showHandles ? 16 : 4 }}
                      >
                        <div
                          className="h-[1.5px] w-full"
                          style={{ background: "var(--grid-line)", opacity: 0.9 }}
                        />
                        {showHandles && (
                          <div
                            className="absolute h-3 w-3 rotate-45 border-2 bg-[var(--menu)]"
                            style={{ borderColor: "var(--accent)" }}
                          />
                        )}
                      </div>
                    ))}

                  {/* hovered block highlight */}
                  {hover && !dragging && (
                    <div
                      className="pointer-events-none absolute border-2"
                      style={{
                        left: `${colP[hover.c] * 100}%`,
                        top: `${rowP[hover.r] * 100}%`,
                        width: `${(colP[hover.c + 1] - colP[hover.c]) * 100}%`,
                        height: `${(rowP[hover.r + 1] - rowP[hover.r]) * 100}%`,
                        borderColor: "var(--accent)",
                        background: "var(--accent-soft)",
                      }}
                    />
                  )}

                  {/* cell numbers */}
                  {showNumbers &&
                    total <= 360 &&
                    Array.from({ length: total }, (_, i) => {
                      const r = Math.floor(i / job.cols);
                      const c = i % job.cols;
                      return (
                        <span
                          key={`n${i}`}
                          className="az-num pointer-events-none absolute font-mono text-[9px] font-bold"
                          style={{
                            left: `${colP[c] * 100}%`,
                            top: `${rowP[r] * 100}%`,
                            padding: "1px 3px",
                            color: "var(--ink)",
                            background: "var(--surface-2)",
                          }}
                        >
                          {i + 1}
                        </span>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* zoom controls */}
        <div className="absolute right-2.5 top-2 z-20 flex items-center gap-1 border border-[var(--line-strong)] bg-[var(--menu)] px-1.5 py-1 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setZoomStep(-1)}
            disabled={zoom <= ZOOM_MIN}
            className="az-icon-btn h-6 w-6 border-none shadow-none"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <IconMinus className="h-3 w-3" />
          </button>
          <span className="az-num w-11 text-center font-bold text-[var(--ink)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomStep(1)}
            disabled={zoom >= ZOOM_MAX}
            className="az-icon-btn h-6 w-6 border-none shadow-none"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <IconPlus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.tick();
              setZoom(1);
              scrollRef.current?.scrollTo({ left: 0, top: 0 });
            }}
            className="az-icon-btn h-6 w-6 border-none shadow-none"
            title="Kembalikan zoom & posisi (100%)"
            aria-label="Reset zoom"
          >
            <IconRefresh className="h-3 w-3" />
          </button>
        </div>

        {/* hover readout */}
        {hover && hoverSize && !dragging && (
          <div className="pointer-events-none absolute bottom-2 left-3 z-20 border border-[var(--line-strong)] bg-[var(--menu)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink)]">
            B{hover.r + 1}·K{hover.c + 1} — POTONGAN {hoverSize.sw}×{hoverSize.sh}px →{" "}
            <strong className="text-[var(--accent)]">
              {hoverSize.w}×{hoverSize.h}px
            </strong>
          </div>
        )}

        {dragging && (
          <div className="pointer-events-none absolute bottom-2 left-3 z-20 border border-[var(--accent-line)] bg-[var(--menu)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)]">
            MENGGESER BLOK — lepaskan untuk menerapkan
          </div>
        )}

        {/* cutting lasers */}
        {cutting && (
          <div className="absolute inset-0 z-30 overflow-hidden bg-[var(--overlay)]/40">
            <div
              className="az-laser-v absolute left-0 right-0 h-[3px]"
              style={{ top: 0, background: "var(--accent)" }}
            />
            <div
              className="az-laser-h absolute bottom-0 top-0 w-[3px]"
              style={{ left: 0, background: "var(--accent)", animationDelay: "0.24s" }}
            />
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
              <span className="az-blink border border-[var(--line-strong)] bg-[var(--menu)] px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-[var(--ink)]">
                MEMOTONG {Math.round(job.progress * 100)}%
              </span>
            </div>
          </div>
        )}

        {cutting && (
          <div className="absolute inset-x-0 bottom-0 z-40 h-[5px] bg-[var(--surface-2)]">
            <div
              className="h-full transition-[width] duration-150"
              style={{ width: `${job.progress * 100}%`, background: "var(--accent)" }}
            />
          </div>
        )}
      </div>

      {/* drag + zoom hint strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-strong)] bg-[var(--surface-2)] px-3.5 py-1.5 font-mono text-[10px] text-[var(--ink-soft)]">
        <span>
          SERET GARIS / BLOK UNTUK MENGGESER POTONGAN · GANDA-KLIK: ZOOM
        </span>
        <span className="flex items-center gap-2">
          <span>CTRL+SCROLL: ZOOM</span>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              props.onUpdate(job.id, { colPos: null, rowPos: null });
              toast("Posisi blok dikembalikan rata", "ok");
            }}
            disabled={!customGrid}
            className="border border-[var(--line-strong)] px-1.5 py-0.5 font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-[var(--on-accent)] disabled:opacity-30"
          >
            RATAKAN BLOK
          </button>
        </span>
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="az-input flex h-9 flex-1 items-center gap-2 px-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
              NAMA:
            </span>
            <input
              value={job.name}
              onChange={(e) => props.onUpdate(job.id, { name: e.target.value })}
              placeholder="nama-berkas"
              maxLength={64}
              aria-label="Nama gambar"
              className="w-full bg-transparent font-mono text-sm font-semibold text-[var(--ink)] outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setFlash(true);
              setTimeout(() => setFlash(false), 250);
              props.onSyncGrid(job.id);
            }}
            title="Terapkan ukuran & posisi grid ini ke semua gambar"
            className={`az-btn az-btn-ghost h-9 px-3 font-mono text-[11px] uppercase tracking-wider ${flash ? "az-pop" : ""}`}
          >
            <IconSync className="h-3.5 w-3.5" />
            Samakan Grid ke Semua
          </button>
        </div>

        {/* Steppers & Presets 1x1 .. 100x100 */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Stepper
              label="Kolom"
              value={job.cols}
              onChange={(v) => props.onUpdate(job.id, { cols: v, colPos: null })}
            />
            <Stepper
              label="Baris"
              value={job.rows}
              onChange={(v) => props.onUpdate(job.id, { rows: v, rowPos: null })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
              PRESET:
            </span>
            {PRESETS.map((n) => {
              const active = job.cols === n && job.rows === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    props.onUpdate(job.id, {
                      cols: n,
                      rows: n,
                      colPos: null,
                      rowPos: null,
                    });
                  }}
                  className={`az-num border px-2 py-0.5 font-mono text-[11px] font-bold transition ${
                    active
                      ? "border-[var(--line-strong)] bg-[var(--accent)] text-[var(--on-accent)]"
                      : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)] hover:border-[var(--accent-line)] hover:text-[var(--ink)]"
                  }`}
                >
                  {n}×{n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution Rescale & Trim */}
        <div className="az-nested space-y-3 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="az-label">Skala Resolusi</span>
              <span className="az-num border border-[var(--line-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--accent)]">
                ×{job.scale.toFixed(2)}
              </span>
            </div>
            <span className="az-num font-mono text-[11px] text-[var(--ink-faint)]">
              Blok pertama: {baseCW}×{baseCH}px →{" "}
              <strong className="text-[var(--accent)]">
                {outW.toLocaleString()}×{outH.toLocaleString()}px
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={0.05}
              value={job.scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              onPointerUp={() => sfx.tick()}
              aria-label="Skala ukuran hasil potongan"
              className="az-range w-full"
              style={{ "--fill": `${scalePct}%` } as React.CSSProperties}
            />
            <div className="flex shrink-0 gap-1">
              {SCALE_CHIPS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    sfx.tick();
                    setScale(v);
                  }}
                  className={`az-num border px-1.5 py-0.5 font-mono text-[10px] font-bold transition ${
                    job.scale === v
                      ? "border-[var(--line-strong)] bg-[var(--accent)] text-[var(--on-accent)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {v}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="az-label w-20 shrink-0">Kupas Tepi</span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.25}
              value={job.trim}
              onChange={(e) => props.onUpdate(job.id, { trim: parseFloat(e.target.value) })}
              onPointerUp={() => sfx.tick()}
              aria-label="Persentase kupas tepi gambar"
              className="az-range w-full"
              style={{ "--fill": `${trimPct}%` } as React.CSSProperties}
            />
            <span className="az-num w-11 shrink-0 text-right font-mono text-[11px] font-bold text-[var(--ink-faint)]">
              {job.trim}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="az-seg">
              {(["png", "jpeg"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    sfx.snap();
                    props.onUpdate(job.id, { format: f });
                  }}
                  className={`az-seg-item ${job.format === f ? "az-seg-item-on" : ""}`}
                >
                  {f === "jpeg" ? "JPG" : "PNG"}
                </button>
              ))}
            </div>
            {job.format === "jpeg" && (
              <div className="flex min-w-[140px] flex-1 items-center gap-2">
                <span className="az-label">Mutu</span>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={Math.round(job.quality * 100)}
                  onChange={(e) =>
                    props.onUpdate(job.id, { quality: parseInt(e.target.value, 10) / 100 })
                  }
                  className="az-range w-full"
                  style={{ "--fill": `${((job.quality * 100 - 50) / 50) * 100}%` } as React.CSSProperties}
                />
                <span className="az-num w-8 text-right font-mono text-[11px] text-[var(--ink-faint)]">
                  {Math.round(job.quality * 100)}
                </span>
              </div>
            )}
            {bigGrid && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--accent)]">
                <IconWarn className="h-3.5 w-3.5" />
                Grid padat ({total.toLocaleString()} sel)
              </span>
            )}
          </div>
        </div>

        {job.status === "error" && (
          <div className="az-badge-bad flex items-center gap-2 px-3 py-2 font-mono text-xs">
            <IconX className="h-3.5 w-3.5 shrink-0" />
            {job.error || "Gagal memotong gambar ini"}
          </div>
        )}

        {/* Primary Action Bar */}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => props.onCut(job.id)}
            disabled={cutting || job.status === "loading" || !job.img}
            className="az-btn az-btn-primary h-10 flex-1 font-mono text-xs uppercase tracking-wider"
          >
            {cutting ? (
              <IconSpinner className="az-spin h-4 w-4" />
            ) : (
              <IconScissors className="h-4 w-4" />
            )}
            {cutting ? "Memotong…" : done ? "Potong Ulang" : "Potong Grid Sekarang"}
          </button>

          {done && job.blobs && (
            <>
              <button
                type="button"
                onClick={() => props.onDownload(job.id)}
                disabled={props.packing}
                className="az-btn az-btn-ghost h-10 px-4 font-mono text-xs uppercase tracking-wider"
              >
                <IconBox className="h-4 w-4" />
                Unduh {job.name}.zip
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.pop(1);
                  props.onReset(job.id);
                }}
                title="Bersihkan hasil potongan"
                className="az-icon-btn h-10 w-10"
              >
                <IconRefresh className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Sliced cell drawer */}
        {done && job.cells && (
          <div className="az-fade-up space-y-2 border-t border-dashed border-[var(--line-strong)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--ink-faint)]">
              <span className="az-num font-bold text-[var(--good)]">
                {job.cells.length.toLocaleString()} KEPING TERPOTONG
              </span>
              <span className="az-num">
                {job.cells.length > 0
                  ? `${Math.min(...job.cells.map((c) => c.w))}–${Math.max(
                      ...job.cells.map((c) => c.w),
                    )}px lebar`
                  : ""}{" "}
                · total {fmtBytes(job.blobs ? job.blobs.reduce((s, b) => s + b.size, 0) : 0)}
              </span>
            </div>
            {job.cells.length > MAX_THUMBS && (
              <p className="font-mono text-[10px] text-[var(--accent)]">
                Menampilkan {MAX_THUMBS} pratinjau pertama — seluruh{" "}
                {job.cells.length.toLocaleString()} keping tetap masuk ke arsip unduhan
                (pratinjau lainnya dibuka on-demand).
              </p>
            )}
            <div className="az-checker az-scroll grid max-h-60 grid-cols-6 gap-1.5 overflow-y-auto border border-[var(--line-strong)] p-2 sm:grid-cols-8">
              {shown.map((cell, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sfx.pop(i % 8);
                    props.onOpenCell(job.id, i);
                  }}
                  title={`Klik untuk periksa ${cell.name} (${cell.w}×${cell.h}px)`}
                  className="az-pop relative overflow-hidden border border-[var(--line)] transition hover:border-[var(--accent)]"
                  style={{ animationDelay: `${Math.min(i, 36) * 20}ms` }}
                >
                  {cell.thumb ? (
                    <img
                      src={cell.thumb}
                      alt={cell.name}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex aspect-square w-full items-center justify-center bg-[var(--surface-3)] font-mono text-[9px] text-[var(--ink-soft)]">
                      #{i + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function trim0(v: number): number {
  return Math.max(0, v);
}
