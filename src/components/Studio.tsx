"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Job, LayoutMode } from "@/lib/types";
import { uid } from "@/lib/types";
import {
  cellNames,
  cutGrid,
  downloadBlob,
  fmtBytes,
  loadImage,
  packZip,
  sanitizeName,
} from "@/lib/cut";
import { sfx } from "@/lib/sound";
import { themeById } from "@/lib/theme";
import JobCard from "./JobCard";
import DonationSection from "./DonationSection";
import ParticlesCanvas from "./Particles";
import Toasts, { toast } from "./Toasts";
import ThemeSettings from "./ThemeSettings";
import CelebrationBanner from "./CelebrationBanner";
import CelebrationAmbient from "./CelebrationAmbient";
import { useAzura } from "./ThemeProvider";
import {
  IconBox,
  IconChevronL,
  IconChevronR,
  IconDownload,
  IconGrid,
  IconHeartStamp,
  IconImage,
  IconLogo,
  IconMute,
  IconScissors,
  IconSliders,
  IconSound,
  IconSpinner,
  IconTrash,
  IconUpload,
  IconWarn,
  IconX,
} from "./Icons";

const ACCEPT = "image/*";

function newJob(file: File): Job {
  const base = file.name.replace(/\.[^.]+$/, "") || "lembar-grid";
  return {
    id: uid(),
    name: base,
    url: URL.createObjectURL(file),
    img: null,
    imgW: 0,
    imgH: 0,
    cols: 4,
    rows: 4,
    layout: "uniform" as LayoutMode,
    colPos: null,
    rowPos: null,
    overlays: [],
    trim: 0,
    scale: 1,
    format: "png",
    quality: 0.92,
    status: "loading",
    progress: 0,
    cells: null,
    blobs: null,
    outW: 0,
    outH: 0,
  };
}

/** Generates a 1200x1200 studio calibration sheet using the 10-colour palette */
async function createCalibrationFile(): Promise<File> {
  const size = 1200;
  const cols = 4;
  const rows = 4;
  const cell = size / cols;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const cx = cv.getContext("2d");
  if (!cx) throw new Error("Canvas 2D tidak tersedia");

  const palette = [
    "#002147",
    "#C47623",
    "#00594E",
    "#781C2E",
    "#124D95",
    "#352323",
    "#D2B48C",
    "#002147",
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const bg = palette[(r * 3 + c) % palette.length];
      const x = c * cell;
      const y = r * cell;
      cx.fillStyle = bg;
      cx.fillRect(x, y, cell, cell);

      // Inner frame
      cx.strokeStyle = "#FFF6E4";
      cx.lineWidth = 3;
      cx.strokeRect(x + 18, y + 18, cell - 36, cell - 36);

      // Geometric motif
      cx.fillStyle = idx % 2 === 0 ? "#FFF6E4" : "#E9F5FF";
      cx.beginPath();
      cx.arc(x + cell / 2, y + cell / 2 - 12, 54, 0, Math.PI * 2);
      cx.fill();

      cx.fillStyle = bg;
      cx.font = "bold 36px monospace";
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      cx.fillText(String(idx + 1).padStart(2, "0"), x + cell / 2, y + cell / 2 - 12);

      // Technical label
      cx.fillStyle = "#FFF6E4";
      cx.font = "bold 18px monospace";
      cx.fillText(`R${r + 1}·C${c + 1} [300px]`, x + cell / 2, y + cell - 46);
    }
  }

  const blob: Blob = await new Promise((res, rej) =>
    cv.toBlob((b) => (b ? res(b) : rej(new Error("Gagal membuat sampel"))), "image/png"),
  );
  return new File([blob], "lembar-uji-azuralimit", { type: "image/png" });
}

export default function Studio() {
  const { settings, set, celebrate, rainFx } = useAzura();

  const [activeTab, setActiveTab] = useState<"studio" | "donasi">("studio");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [cutAllBusy, setCutAllBusy] = useState(false);
  const [packing, setPacking] = useState(false);
  const [archiveFormat, setArchiveFormat] = useState<"zip" | "rar">("zip");
  const [clearArmed, setClearArmed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lightbox, setLightbox] = useState<{ jobId: string; idx: number } | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ---------------- jobs ---------------- */

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const addFiles = useCallback(
    (files: File[] | FileList) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        sfx.buzz();
        toast("File yang dipilih bukan gambar", "err");
        return;
      }
      sfx.drop();
      const created = list.map(newJob);
      setJobs((js) => [...js, ...created]);
      created.forEach((job) => {
        void (async () => {
          try {
            const img = await loadImage(job.url);
            updateJob(job.id, {
              img,
              imgW: img.naturalWidth,
              imgH: img.naturalHeight,
              status: "idle",
            });
          } catch {
            updateJob(job.id, { status: "error", error: "Gambar tidak dapat dibaca" });
          }
        })();
      });
      setActiveTab("studio");
      toast(`${list.length} lembar gambar masuk ke meja potong`, "ok");
    },
    [updateJob],
  );

  const loadSampleSheet = useCallback(async () => {
    try {
      sfx.click();
      const file = await createCalibrationFile();
      addFiles([file]);
    } catch {
      toast("Gagal membuat lembar uji", "err");
    }
  }, [addFiles]);

  const removeJob = useCallback((id: string) => {
    setJobs((js) => {
      const j = js.find((x) => x.id === id);
      if (j) URL.revokeObjectURL(j.url);
      return js.filter((x) => x.id !== id);
    });
    setLightbox((l) => (l && l.jobId === id ? null : l));
  }, []);

  const clearAll = useCallback(() => {
    if (!clearArmed) {
      setClearArmed(true);
      sfx.tick();
      setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    setJobs((js) => {
      js.forEach((j) => URL.revokeObjectURL(j.url));
      return [];
    });
    setClearArmed(false);
    sfx.pop(2);
    toast("Meja potong telah dibersihkan", "info");
  }, [clearArmed]);

  /* ---------------- cutting ---------------- */

  const totalCells = useMemo(() => {
    return jobs.reduce((s, j) => {
      if (j.layout === "freeform") return s + j.overlays.length;
      return s + j.cols * j.rows;
    }, 0);
  }, [jobs]);

  const cutJob = useCallback(
    async (id: string) => {
      const j = jobs.find((x) => x.id === id);
      if (!j || !j.img || j.status === "cutting") return;
      sfx.slice();
      updateJob(id, { status: "cutting", progress: 0, error: undefined });
      try {
        const out = await cutGrid({
          img: j.img,
          layout: j.layout,
          cols: j.cols,
          rows: j.rows,
          colPos: j.colPos,
          rowPos: j.rowPos,
          overlays: j.layout === "freeform" ? j.overlays : undefined,
          trim: j.trim,
          scale: j.scale,
          format: j.format,
          quality: j.quality,
          onProgress: (p) => updateJob(id, { progress: p }),
        });
        const totalCells = j.layout === "freeform" ? j.overlays.length : j.cols * j.rows;
        const names =
          j.layout === "freeform"
            ? j.overlays.map(
                (o, i) =>
                  `${sanitizeName(j.name)}_${i + 1}.${out.ext}`,
              )
            : cellNames(sanitizeName(j.name), j.cols, j.rows, out.ext);
        const varied =
          out.sizes.length > 1 &&
          out.sizes.some((s) => s.w !== out.outW || s.h !== out.outH);
        updateJob(id, {
          status: "done",
          progress: 1,
          cells: names.map((n, i) => ({
            name: n,
            thumb: out.thumbs[i],
            w: out.sizes[i]?.w ?? out.outW,
            h: out.sizes[i]?.h ?? out.outH,
          })),
          blobs: out.blobs,
          outW: out.outW,
          outH: out.outH,
        });
        sfx.chime();
        [0, 1, 2, 3].forEach((i) => window.setTimeout(() => sfx.pop(i), 120 + i * 80));
        const rect = cardRefs.current[id]?.getBoundingClientRect();
        if (rect) celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, 1);
        const sizeNote = varied
          ? `ukuran bervariasi per blok (keping pertama ${out.outW}×${out.outH}px)`
          : `${out.outW}×${out.outH}px`;
        const modeNote = j.layout === "freeform" ? " (mode freeform)" : "";
        if (out.clamped) {
          toast(
            `${j.name}: ${names.length.toLocaleString()} keping selesai${modeNote} (${sizeNote} — batas aman resolusi tinggi)`,
            "ok",
          );
        } else {
          toast(
            `${j.name}: ${names.length.toLocaleString()} keping selesai dipotong${modeNote} (${sizeNote})`,
            "ok",
          );
        }
      } catch (e) {
        updateJob(id, {
          status: "error",
          error: e instanceof Error ? e.message : "Gagal memotong gambar",
        });
        sfx.buzz();
        toast("Proses pemotongan gagal", "err");
      }
    },
    [jobs, updateJob, celebrate],
  );

  const cutAll = useCallback(async () => {
    if (cutAllBusy) return;
    const targets = jobs.filter((j) => j.img && j.status !== "cutting");
    if (targets.length === 0) return;
    setCutAllBusy(true);
    sfx.click();
    for (const t of targets) {
      await cutJob(t.id);
      await new Promise((r) => setTimeout(r, 60));
    }
    setCutAllBusy(false);
    rainFx(60);
    toast("Semua lembar di meja kerja selesai dipotong!", "ok");
  }, [cutAllBusy, jobs, cutJob, rainFx]);

  const syncGrid = useCallback(
    (srcId: string) => {
      const src = jobs.find((j) => j.id === srcId);
      if (!src) return;
      setJobs((js) =>
        js.map((j) => {
          if (j.id === srcId) return j;
          // Only propagate state relevant to the destination layout
          if (src.layout === "freeform") {
            return {
              ...j,
              layout: "freeform",
              cols: j.layout === "freeform" ? j.cols : 1,
              rows: j.layout === "freeform" ? j.rows : 1,
              overlays: src.overlays.map((o) => ({ ...o, id: uid() })),
            };
          }
          return {
            ...j,
            layout: src.layout,
            cols: src.cols,
            rows: src.rows,
            colPos: src.colPos ? [...src.colPos] : null,
            rowPos: src.rowPos ? [...src.rowPos] : null,
          };
        }),
      );
      const note =
        src.layout === "freeform"
          ? `Mode freeform (${src.overlays.length} blok) disalin ke seluruh lembar`
          : `Grid ${src.cols}×${src.rows}${src.colPos ? " (posisi blok disalin)" : ""} disamakan ke seluruh lembar`;
      toast(note, "ok");
    },
    [jobs],
  );

  const resetJob = useCallback(
    (id: string) =>
      updateJob(id, {
        status: "idle",
        cells: null,
        blobs: null,
        progress: 0,
        error: undefined,
      }),
    [updateJob],
  );

  /* ---------------- archives ---------------- */

  const noteRar = useCallback(() => {
    if (archiveFormat === "rar") {
      toast(
        "Format RAR bersifat tertutup di browser — arsip dikemas sebagai .zip agar langsung bisa diekstrak di semua perangkat",
        "info",
      );
    }
  }, [archiveFormat]);

  const downloadJob = useCallback(
    async (id: string) => {
      const j = jobs.find((x) => x.id === id);
      if (!j || !j.cells || !j.blobs) return;
      setPacking(true);
      sfx.click();
      try {
        const ext = j.format === "png" ? "png" : "jpg";
        const names = cellNames(sanitizeName(j.name), j.cols, j.rows, ext);
        const zip = await packZip([
          { name: "", entries: names.map((n, i) => ({ name: n, blob: j.blobs![i] })) },
        ]);
        noteRar();
        downloadBlob(zip, `${sanitizeName(j.name)}.zip`);
        sfx.chime();
        toast(`${sanitizeName(j.name)}.zip siap diunduh (${fmtBytes(zip.size)})`, "ok");
      } catch {
        sfx.buzz();
        toast("Gagal mengemas arsip", "err");
      } finally {
        setPacking(false);
      }
    },
    [jobs, noteRar],
  );

  const downloadAll = useCallback(async () => {
    const ready = jobs.filter((j) => j.cells && j.blobs);
    if (ready.length === 0) return;
    setPacking(true);
    sfx.click();
    try {
      const used = new Set<string>();
      const folders = ready.map((j) => {
        let base = sanitizeName(j.name);
        let k = 2;
        while (used.has(base)) base = `${sanitizeName(j.name)}-${k++}`;
        used.add(base);
        const ext = j.format === "png" ? "png" : "jpg";
        const names = cellNames(base, j.cols, j.rows, ext);
        return {
          name: base,
          entries: names.map((n, i) => ({ name: n, blob: j.blobs![i] })),
        };
      });
      const zip = await packZip(folders);
      noteRar();
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
      downloadBlob(zip, `azuralimit_${stamp}.zip`);
      sfx.chime();
      toast(`azuralimit_${stamp}.zip siap (${fmtBytes(zip.size)})`, "ok");
    } catch {
      sfx.buzz();
      toast("Gagal mengemas arsip gabungan", "err");
    } finally {
      setPacking(false);
    }
  }, [jobs, noteRar]);

  /* ---------------- global handlers ---------------- */

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      const j = jobs.find((x) => x.id === lightbox.jobId);
      const n = j?.cells?.length ?? 0;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && n > 1)
        setLightbox({ ...lightbox, idx: (lightbox.idx + 1) % n });
      if (e.key === "ArrowLeft" && n > 1)
        setLightbox({ ...lightbox, idx: (lightbox.idx - 1 + n) % n });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, jobs]);

  /* ---------------- derived ---------------- */

  const stats = useMemo(() => {
    const size = jobs.reduce(
      (s, j) => s + (j.blobs ? j.blobs.reduce((a, b) => a + b.size, 0) : 0),
      0,
    );
    const ready = jobs.filter((j) => j.status === "done").length;
    return { cells: totalCells, size, ready };
  }, [jobs, totalCells]);

  const activeTheme = themeById(settings.theme);
  const lbJob = lightbox ? jobs.find((j) => j.id === lightbox.jobId) : null;
  const lbCell = lbJob?.cells?.[lightbox?.idx ?? 0] ?? null;

  // Cells beyond the first 64 have no thumbnail — resolve a Blob URL on demand
  const lbJobId = lightbox?.jobId ?? null;
  const lbIdx = lightbox?.idx ?? -1;
  const [lbSrc, setLbSrc] = useState("");
  useEffect(() => {
    if (!lbJob || !lbCell) {
      setLbSrc("");
      return;
    }
    if (lbCell.thumb) {
      setLbSrc(lbCell.thumb);
      return;
    }
    const b = lbJob.blobs?.[lbIdx];
    if (!b) {
      setLbSrc("");
      return;
    }
    const url = URL.createObjectURL(b);
    setLbSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [lbJobId, lbIdx, lbJob, lbCell]);

  return (
    <div className="relative min-h-screen">
      <CelebrationAmbient />
      <ParticlesCanvas />
      <Toasts />
      <ThemeSettings open={showSettings} onClose={() => setShowSettings(false)} />

      {/* ---------------- Tactile Workbench Masthead ---------------- */}
      <header className="sticky top-0 z-40 border-b-2 border-[var(--line-strong)] bg-[var(--menu)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.tick();
                setActiveTab("studio");
              }}
              className="flex items-center gap-3 text-left"
            >
              <IconLogo className="h-9 w-9 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                    AZURALIMIT
                  </span>
                  <span className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)]">
                    EDISI 2026
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">
                  MEJA POTONG GRID &amp; RESCALE STUDIO
                </div>
              </div>
            </button>
          </div>

          {/* Primary Navigation Tabs: Meja Potong vs Halaman Donasi */}
          <nav
              aria-label="Navigasi Utama Studio"
              className="flex max-w-full flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setActiveTab("studio");
              }}
              className={`az-btn h-9 px-3.5 font-mono text-xs uppercase tracking-wider ${
                activeTab === "studio" ? "az-btn-primary" : "az-btn-ghost"
              }`}
            >
              <IconScissors className="h-3.5 w-3.5" />
              [01] Meja Potong
              {jobs.length > 0 && (
                <span className="ml-1 border border-current px-1 text-[10px]">
                  {jobs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                setActiveTab("donasi");
              }}
              className={`az-btn h-9 px-3.5 font-mono text-xs uppercase tracking-wider ${
                activeTab === "donasi" ? "az-btn-primary" : "az-btn-ghost"
              }`}
            >
              <IconHeartStamp className="h-3.5 w-3.5" />
              [02] Halaman Donasi
            </button>
          </nav>

          {/* Right tools: Theme switcher & Sound toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setShowSettings(true);
              }}
              title="Buka Rak Pengaturan Tema & Suara"
              className="az-btn az-btn-ghost h-9 max-w-[calc(100vw-100px)] px-3 font-mono text-xs sm:max-w-[330px]"
            >
              <IconSliders className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline">Tema:</span>
              <span className="min-w-0 truncate font-bold text-[var(--accent)]">{activeTheme.name}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                set({ sound: !settings.sound });
                if (!settings.sound) sfx.snap();
              }}
              title={settings.sound ? "Matikan suara mekanis" : "Nyalakan suara mekanis"}
              className={`az-icon-btn h-9 w-9 ${settings.sound ? "az-icon-btn-on" : ""}`}
              aria-label="Sakelar suara"
            >
              {settings.sound ? (
                <IconSound className="h-4 w-4" />
              ) : (
                <IconMute className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- Main Workbench Content ---------------- */}
      <main className="mx-auto max-w-[1440px] space-y-7 px-4 py-6 sm:px-6">
        <CelebrationBanner onOpenThemes={() => setShowSettings(true)} />
        {activeTab === "donasi" ? (
          <div className="az-fade-up space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3">
              <div className="font-mono text-xs text-[var(--ink-faint)]">
                Menampilkan <strong className="text-[var(--ink)]">Halaman Donasi Resmi</strong>{" "}
                — DANA &amp; 7 Jaringan Kripto
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setActiveTab("studio");
                }}
                className="az-btn az-btn-ghost h-8 px-3 font-mono text-xs uppercase tracking-wider"
              >
                ← Kembali ke Meja Potong
              </button>
            </div>

            <DonationSection standalone />
          </div>
        ) : (
          <>
            {/* Editorial Workbench Header + Interactive Cutting Mat Dropzone */}
            <section className="grid gap-6 lg:grid-cols-12">
              {/* Left 5 cols: Editorial printmaker spec sheet */}
              <div className="az-card flex flex-col justify-between lg:col-span-5">
                <div className="az-ruler-strip flex items-center justify-between border-b border-[var(--line-strong)] px-4 py-2 font-mono text-[11px] text-[var(--ink-soft)]">
                  <span>MANUAL MEJA KERJA // NO. 01</span>
                  <span>SKALA 1:1 — 1:10</span>
                </div>

                <div className="space-y-4 p-5">
                  <h1 className="font-display text-2xl font-semibold leading-snug text-[var(--ink)] sm:text-3xl">
                    Potong lembaran gambar presisi hingga{" "}
                    <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                      100×100 grid
                    </span>
                    , langsung di atas meja kerjamu.
                  </h1>
                  <p className="text-sm leading-relaxed text-[var(--ink-faint)]">
                    Dirancang seperti meja potong cetak manual: masukkan satu atau banyak
                    gambar sekaligus, atur jumlah kolom &amp; baris masing-masing (atau samakan
                    serentak), perbesar ukuran tiap keping hasil potongan dari{" "}
                    <strong className="font-mono text-[var(--ink)]">500×500px</strong> hingga{" "}
                    <strong className="font-mono text-[var(--ink)]">5000×5000px</strong>, lalu
                    unduh bundel arsip sesuai nama gambar.
                  </p>

                  {/* Technical Spec Grid */}
                  <dl className="grid grid-cols-2 gap-2 border-y border-dashed border-[var(--line-strong)] py-3 font-mono text-xs">
                    <div>
                      <dt className="text-[10px] text-[var(--ink-soft)]">KAPASITAS PISAU</dt>
                      <dd className="font-bold text-[var(--ink)]">1×1 s/d 100×100 Sel</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[var(--ink-soft)]">SKALA INDIVIDU</dt>
                      <dd className="font-bold text-[var(--ink)]">0.25× s/d 10.0× Lipat</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[var(--ink-soft)]">MODE ANTREAN</dt>
                      <dd className="font-bold text-[var(--ink)]">Sama &amp; Beda Format</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[var(--ink-soft)]">KEMASAN UNDUH</dt>
                      <dd className="font-bold text-[var(--ink)]">ZIP / RAR Sesuai Nama</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-strong)] bg-[var(--surface-2)] px-5 py-3">
                  <button
                    type="button"
                    onClick={loadSampleSheet}
                    className="az-btn az-btn-ghost h-9 px-3 font-mono text-xs uppercase tracking-wider"
                  >
                    <IconGrid className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Muat Lembar Uji 4×4
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setActiveTab("donasi");
                    }}
                    className="font-mono text-xs font-bold text-[var(--accent)] underline decoration-dotted underline-offset-4 hover:text-[var(--ink)]"
                  >
                    Buka Halaman Donasi →
                  </button>
                </div>
              </div>

              {/* Right 7 cols: Tactile Self-Healing Cutting Mat Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`az-cutting-mat relative flex flex-col justify-between p-5 lg:col-span-7 ${
                  dragActive ? "az-cutting-mat-hot" : ""
                }`}
              >
                {/* Top millimeter ruler numbers */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 font-mono text-[10px] text-[var(--ink-soft)] select-none">
                  <span>0px</span>
                  <span>200px</span>
                  <span>400px</span>
                  <span>600px</span>
                  <span className="hidden sm:inline">800px</span>
                  <span className="hidden sm:inline">1000px</span>
                  <span>ALAS POTONG AKTIF</span>
                </div>

                <div className="my-6 flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center border-2 border-[var(--line-strong)] bg-[var(--surface)] text-[var(--accent)] shadow-[3px_3px_0_var(--shadow-hard)]">
                    <IconUpload className="h-7 w-7" />
                  </div>

                  <p className="mt-4 font-display text-xl font-semibold text-[var(--ink)] sm:text-2xl">
                    {dragActive
                      ? "Lepaskan berkas di atas alas potong ini"
                      : "Letakkan lembaran gambar di atas meja potong"}
                  </p>
                  <p className="mt-1 max-w-md font-mono text-xs text-[var(--ink-faint)]">
                    Mendukung PNG, JPG, WebP, GIF · Bisa pilih banyak berkas sekaligus atau
                    tempel langsung dari papan klip (<kbd className="border border-[var(--line-strong)] px-1">Ctrl+V</kbd>)
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        fileInput.current?.click();
                      }}
                      className="az-btn az-btn-primary h-11 px-6 font-mono text-xs uppercase tracking-wider"
                    >
                      <IconImage className="h-4 w-4" />
                      Pilih Gambar dari Perangkat
                    </button>
                    <button
                      type="button"
                      onClick={loadSampleSheet}
                      className="az-btn az-btn-ghost h-11 px-4 font-mono text-xs uppercase tracking-wider"
                    >
                      Coba dengan Gambar Sampel
                    </button>
                  </div>

                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Bottom registration footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-2 font-mono text-[10px] text-[var(--ink-soft)]">
                  <span>+ TANDA REGISTRASI SUDUT AKTIF</span>
                  <span>PEMROSESAN LOKAL · PRIVASI 100% TERJAGA</span>
                </div>
              </div>
            </section>

            {/* ---------------- Active Workbench Queue ---------------- */}
            {jobs.length > 0 && (
              <section className="space-y-4">
                <div className="az-card flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 bg-[var(--accent)]" />
                    <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
                      Meja Kerja Aktif
                    </h2>
                  </div>
                  <span className="az-num border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--ink-soft)]">
                    {jobs.length} LEMBAR · {stats.cells.toLocaleString()} KEPING DIRENCANAKAN ·{" "}
                    {fmtBytes(stats.size)} HASIL
                  </span>

                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="az-seg">
                      {(["zip", "rar"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            sfx.snap();
                            setArchiveFormat(f);
                          }}
                          className={`az-seg-item ${archiveFormat === f ? "az-seg-item-on" : ""}`}
                          title={
                            f === "rar"
                              ? "Format RAR dikemas sebagai arsip .zip yang kompatibel di semua aplikasi"
                              : undefined
                          }
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    {archiveFormat === "rar" && (
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[var(--accent)]">
                        <IconWarn className="h-3 w-3" /> dikemas .zip
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={cutAll}
                      disabled={cutAllBusy || jobs.every((j) => !j.img || j.status === "cutting")}
                      className="az-btn az-btn-primary h-9 px-3.5 font-mono text-xs uppercase tracking-wider"
                    >
                      {cutAllBusy ? (
                        <IconSpinner className="az-spin h-3.5 w-3.5" />
                      ) : (
                        <IconScissors className="h-3.5 w-3.5" />
                      )}
                      Potong Semua ({jobs.length})
                    </button>
                    <button
                      type="button"
                      onClick={downloadAll}
                      disabled={packing || stats.ready === 0}
                      className="az-btn az-btn-ghost h-9 px-3.5 font-mono text-xs uppercase tracking-wider"
                    >
                      {packing ? (
                        <IconSpinner className="az-spin h-3.5 w-3.5" />
                      ) : (
                        <IconDownload className="h-3.5 w-3.5" />
                      )}
                      {packing ? "Mengemas…" : "Unduh Semua ZIP"}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className={`az-btn h-9 px-3.5 font-mono text-xs uppercase tracking-wider ${
                        clearArmed ? "az-btn-bad" : "az-btn-ghost"
                      }`}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      {clearArmed ? "Yakin Hapus?" : "Kosongkan Meja"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  {jobs.map((job, i) => (
                    <div
                      key={job.id}
                      className="az-fade-up"
                      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    >
                      <JobCard
                        index={i}
                        job={job}
                        onUpdate={updateJob}
                        onRemove={removeJob}
                        onCut={cutJob}
                        onDownload={downloadJob}
                        onSyncGrid={syncGrid}
                        onReset={resetJob}
                        onOpenCell={(jobId, idx) => setLightbox({ jobId, idx })}
                        packing={packing}
                        refCb={(el) => {
                          cardRefs.current[job.id] = el;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ---------------- Donation Section (replaces Google Drive section) ---------------- */}
            <DonationSection />
          </>
        )}

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--line-strong)] pb-8 pt-4 font-mono text-xs text-[var(--ink-faint)]">
          <span className="flex items-center gap-2">
            <IconLogo className="h-4 w-4" />
            <strong className="text-[var(--ink)]">AZURALIMIT</strong> · MEJA POTONG GRID MANDIRI
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setActiveTab("donasi");
              }}
              className="font-bold text-[var(--accent)] underline decoration-dotted underline-offset-4 hover:text-[var(--ink)]"
            >
              Dukung via DANA / Kripto
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setShowSettings(true);
              }}
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink)]"
            >
              Ganti Tema ({activeTheme.name})
            </button>
          </div>
        </footer>
      </main>

      {/* ---------------- Cell Inspection Lightbox ---------------- */}
      {lightbox && lbJob && lbCell && (
        <div
          className="az-veil fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="az-pop az-card az-checker relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line-strong)] bg-[var(--menu)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm font-bold text-[var(--ink)]">
                  {lbCell.name}
                </div>
                <div className="az-num font-mono text-[11px] text-[var(--ink-faint)]">
                  {lbCell.w.toLocaleString()} × {lbCell.h.toLocaleString()} px ·{" "}
                  {lbJob.format === "png" ? "PNG" : "JPG"} · Lembar {lbJob.name} ({lbJob.cols}×
                  {lbJob.rows})
                </div>
              </div>
              <span className="az-num border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 font-mono text-xs font-bold text-[var(--ink)]">
                {(lightbox.idx + 1).toLocaleString()} /{" "}
                {(lbJob.cells?.length ?? 0).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="az-icon-btn h-8 w-8"
                aria-label="Tutup pratinjau"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-5">
              <img
                src={lbSrc || lbCell.thumb}
                alt={lbCell.name}
                className="max-h-[62vh] max-w-full border-2 border-[var(--line-strong)] object-contain shadow-[4px_4px_0_var(--shadow-hard)]"
                style={{ imageRendering: lbCell.w <= 200 ? "pixelated" : "auto" }}
              />
            </div>
            <div className="flex items-center gap-2 border-t border-[var(--line-strong)] bg-[var(--menu)] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  sfx.tick();
                  const n = lbJob.cells?.length ?? 0;
                  if (n > 1) setLightbox({ ...lightbox, idx: (lightbox.idx - 1 + n) % n });
                }}
                className="az-icon-btn h-9 w-9"
                aria-label="Keping sebelumnya"
              >
                <IconChevronL className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.tick();
                  const n = lbJob.cells?.length ?? 0;
                  if (n > 1) setLightbox({ ...lightbox, idx: (lightbox.idx + 1) % n });
                }}
                className="az-icon-btn h-9 w-9"
                aria-label="Keping berikutnya"
              >
                <IconChevronR className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  const blob = lbJob.blobs?.[lightbox.idx];
                  if (blob) {
                    downloadBlob(blob, lbCell.name);
                    toast(`${lbCell.name} berhasil disimpan`, "ok");
                  }
                }}
                className="az-btn az-btn-primary ml-auto h-9 px-4 font-mono text-xs uppercase tracking-wider"
              >
                <IconBox className="h-4 w-4" />
                Simpan Keping Ini Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
