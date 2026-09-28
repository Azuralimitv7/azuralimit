"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import { GRID_MAX, SCALE_MAX, SCALE_MIN, clamp } from "@/lib/types";
import { fmtBytes } from "@/lib/cut";
import { sfx } from "@/lib/sound";
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

export default function JobCard(props: Props) {
  const { job, index } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hover, setHover] = useState<{ c: number; r: number } | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [flash, setFlash] = useState(false);

  const total = job.cols * job.rows;
  const t = Math.min(0.45, job.trim / 100);
  const iw = job.imgW * (1 - 2 * t);
  const ih = job.imgH * (1 - 2 * t);
  const baseCW = job.imgW ? Math.round(iw / job.cols) : 0;
  const baseCH = job.imgH ? Math.round(ih / job.rows) : 0;
  const outW = Math.max(1, Math.round((iw / job.cols) * job.scale));
  const outH = Math.max(1, Math.round((ih / job.rows) * job.scale));

  useLayoutEffect(() => {
    const measure = () => {
      const w = wrapRef.current;
      const i = imgRef.current;
      if (!w || !i || !i.naturalWidth) return;
      const wr = w.getBoundingClientRect();
      const ir = i.getBoundingClientRect();
      setBox({ x: ir.left - wr.left, y: ir.top - wr.top, w: ir.width, h: ir.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (imgRef.current) ro.observe(imgRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [job.imgW, job.imgH, job.status]);

  const canHover = box && job.status !== "cutting" && job.imgW > 0;

  const sliceFx = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover || !box) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - box.x;
    const y = e.clientY - rect.top - box.y;
    const c = clamp(Math.floor((x / box.w) * job.cols), 0, job.cols - 1);
    const r = clamp(Math.floor((y / box.h) * job.rows), 0, job.rows - 1);
    setHover({ c, r });
  };

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
        </div>

        <div className="flex items-center gap-1.5">
          {done && (
            <span className="az-pop az-badge-ok az-num px-2 py-0.5 text-[10px] font-bold">
              SELESAI · {job.outW}×{job.outH}px
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

      {/* ---------------- cutting stage preview ---------------- */}
      <div
        ref={wrapRef}
        onMouseMove={sliceFx}
        onMouseLeave={() => setHover(null)}
        className="az-checker relative flex h-[270px] items-center justify-center overflow-hidden border-b border-[var(--line-strong)]"
      >
        {/* Corner registration marks (+) */}
        <span className="pointer-events-none absolute left-2 top-1.5 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute right-2 top-1.5 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-xs text-[var(--ink-soft)]">+</span>
        <span className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-xs text-[var(--ink-soft)]">+</span>

        {job.img ? (
          <img
            ref={imgRef}
            src={job.url}
            alt={job.name}
            draggable={false}
            onLoad={() => {
              const i = imgRef.current;
              if (i && props.job.status === "loading") {
                props.onUpdate(job.id, {
                  status: "idle",
                  imgW: i.naturalWidth,
                  imgH: i.naturalHeight,
                  img: i,
                });
              }
              requestAnimationFrame(() => {
                const w = wrapRef.current;
                const im = imgRef.current;
                if (!w || !im) return;
                const wr = w.getBoundingClientRect();
                const ir = im.getBoundingClientRect();
                setBox({ x: ir.left - wr.left, y: ir.top - wr.top, w: ir.width, h: ir.height });
              });
            }}
            className="max-h-[242px] max-w-[92%] select-none object-contain"
            style={{ filter: "drop-shadow(3px 3px 0 var(--shadow-hard))" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 font-mono text-xs text-[var(--ink-soft)]">
            <IconSpinner className="az-spin h-6 w-6" />
            <span>MEMBACA GAMBAR…</span>
          </div>
        )}

        {box && job.status !== "cutting" && job.imgW > 0 && (
          <div
            className="pointer-events-none absolute"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          >
            <div
              className="absolute inset-0 border-2"
              style={{ borderColor: "var(--grid-line)" }}
            />
            {job.cols > 1 &&
              Array.from({ length: job.cols - 1 }, (_, i) => (
                <div
                  key={`v${i}`}
                  className="absolute bottom-0 top-0 w-px"
                  style={{ left: `${((i + 1) / job.cols) * 100}%`, background: "var(--grid-line)" }}
                />
              ))}
            {job.rows > 1 &&
              Array.from({ length: job.rows - 1 }, (_, i) => (
                <div
                  key={`h${i}`}
                  className="absolute left-0 right-0 h-px"
                  style={{ top: `${((i + 1) / job.rows) * 100}%`, background: "var(--grid-line)" }}
                />
              ))}
            {showNumbers &&
              total <= 360 &&
              Array.from({ length: total }, (_, i) => {
                const r = Math.floor(i / job.cols);
                const c = i % job.cols;
                return (
                  <span
                    key={`n${i}`}
                    className="az-num absolute font-mono text-[9px] font-bold"
                    style={{
                      left: `${(c / job.cols) * 100}%`,
                      top: `${(r / job.rows) * 100}%`,
                      padding: "1px 3px",
                      color: "var(--ink)",
                      background: "var(--surface-2)",
                    }}
                  >
                    {i + 1}
                  </span>
                );
              })}
            {hover && canHover && (
              <div
                className="absolute border-2"
                style={{
                  left: `${(hover.c / job.cols) * 100}%`,
                  top: `${(hover.r / job.rows) * 100}%`,
                  width: `${(1 / job.cols) * 100}%`,
                  height: `${(1 / job.rows) * 100}%`,
                  borderColor: "var(--accent)",
                  background: "var(--accent-soft)",
                }}
              />
            )}
          </div>
        )}

        {hover && canHover && (
          <div className="pointer-events-none absolute bottom-2 left-3 border border-[var(--line-strong)] bg-[var(--menu)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink)]">
            BARIS {hover.r + 1} · KOLOM {hover.c + 1} ({outW}×{outH}px)
          </div>
        )}

        {cutting && (
          <div className="absolute inset-0 overflow-hidden bg-[var(--overlay)]/40">
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
          <div className="absolute inset-x-0 bottom-0 h-[5px] bg-[var(--surface-2)]">
            <div
              className="h-full transition-[width] duration-150"
              style={{ width: `${job.progress * 100}%`, background: "var(--accent)" }}
            />
          </div>
        )}
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* File name & Sync Grid */}
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
            title="Terapkan ukuran grid ini ke semua gambar di meja potong"
            className={`az-btn az-btn-ghost h-9 px-3 font-mono text-[11px] uppercase tracking-wider ${flash ? "az-pop" : ""}`}
          >
            <IconSync className="h-3.5 w-3.5" />
            Samakan Grid ke Semua
          </button>
        </div>

        {/* Steppers & Presets 1x1 .. 100x100 */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Stepper label="Kolom" value={job.cols} onChange={(v) => props.onUpdate(job.id, { cols: v })} />
            <Stepper label="Baris" value={job.rows} onChange={(v) => props.onUpdate(job.id, { rows: v })} />
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
                    props.onUpdate(job.id, { cols: n, rows: n });
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
              Tiap keping: {baseCW}×{baseCH}px →{" "}
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
                Total {fmtBytes(job.blobs ? job.blobs.reduce((s, b) => s + b.size, 0) : 0)} ·{" "}
                {outW.toLocaleString()}×{outH.toLocaleString()}px
              </span>
            </div>
            {job.cells.length > MAX_THUMBS && (
              <p className="font-mono text-[10px] text-[var(--accent)]">
                Menampilkan {MAX_THUMBS} pratinjau pertama — seluruh{" "}
                {job.cells.length.toLocaleString()} keping tetap masuk ke dalam arsip unduhan.
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
                  title={`Klik untuk periksa ${cell.name}`}
                  className="az-pop relative overflow-hidden border border-[var(--line)] transition hover:border-[var(--accent)]"
                  style={{ animationDelay: `${Math.min(i, 36) * 20}ms` }}
                >
                  <img
                    src={cell.thumb}
                    alt={cell.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
