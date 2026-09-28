"use client";

import { useEffect } from "react";
import {
  ACCENTS,
  PATTERNS,
  THEMES,
  themeById,
  type Pattern,
} from "@/lib/theme";
import { sfx } from "@/lib/sound";
import { useAzura } from "./ThemeProvider";
import {
  IconBolt,
  IconCheck,
  IconRefresh,
  IconSpark,
  IconSound,
  IconMute,
  IconX,
} from "./Icons";

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="az-nested p-4">
      <div className="mb-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--ink)]">
          {title}
        </h3>
        {hint && <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink-faint)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
  desc,
  iconOn,
  iconOff,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.snap();
        onChange(!on);
      }}
      className="flex w-full items-center gap-3 border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-left transition hover:border-[var(--accent-line)]"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
          on
            ? "border-[var(--line-strong)] bg-[var(--accent)] text-[var(--on-accent)]"
            : "border-[var(--line)] text-[var(--ink-faint)]"
        }`}
      >
        {on ? iconOn : iconOff}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-[var(--ink)]">{label}</span>
        <span className="block text-[11px] leading-snug text-[var(--ink-faint)]">{desc}</span>
      </span>
      <span className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--ink)]">
        {on ? "AKTIF" : "MATI"}
      </span>
    </button>
  );
}

export default function ThemeSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, set, reset } = useAzura();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const active = themeById(settings.theme);

  return (
    <div
      className="az-veil fixed inset-0 z-[85] flex justify-end bg-[var(--overlay)] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Tampilan Studio"
    >
      <aside
        className="az-slide-left az-scroll relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto border-l-2 border-[var(--line-strong)] bg-[var(--menu)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--line-strong)] bg-[var(--menu)] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center border border-[var(--line-strong)] bg-[var(--accent)] text-[var(--on-accent)]">
            <IconSpark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold leading-tight text-[var(--ink)]">
              Rak Tema &amp; Suara Studio
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
              Tersimpan otomatis di browser ini
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="az-icon-btn h-8 w-8"
            aria-label="Tutup pengaturan"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <Row
            title="10 Tema Meja Kerja"
            hint="Diracik dari 10 warna palet resmi Azuralimit (6 tema gelap & 4 tema terang)."
          >
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => {
                const on = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      set({ theme: t.id });
                    }}
                    title={t.blurb}
                    className={`flex flex-col gap-2 border p-2.5 text-left transition ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[2px_2px_0_var(--shadow-hard)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <span
                      className="flex h-11 w-full items-end gap-1 border border-black/20 p-1.5"
                      style={{ background: t.swatch[0] }}
                    >
                      <span className="h-4 w-4 border border-white/20" style={{ background: t.swatch[1] }} />
                      <span className="h-4 w-4 border border-white/20" style={{ background: t.swatch[2] }} />
                      <span
                        className="ml-auto px-1 font-mono text-[9px] font-bold uppercase"
                        style={{ background: t.swatch[2], color: relInk(t.swatch[2]) }}
                      >
                        {t.mode === "dark" ? "GELAP" : "TERANG"}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-mono text-[11px] font-bold text-[var(--ink)]">
                        {t.name}
                      </span>
                      {on && <IconCheck className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Row>

          <Row
            title="Warna Aksen Kustom"
            hint="Ganti warna tombol utama, garis potong grid, dan penanda aktif."
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.snap();
                  set({ accent: null });
                }}
                className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[11px] font-bold transition ${
                  settings.accent === null
                    ? "border-[var(--line-strong)] bg-[var(--accent)] text-[var(--on-accent)]"
                    : "border-[var(--line)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                <IconRefresh className="h-3 w-3" />
                Bawaan Tema
              </button>
              {ACCENTS.map((a) => {
                const on = settings.accent === a.hex;
                return (
                  <button
                    key={a.hex}
                    type="button"
                    onClick={() => {
                      sfx.tick();
                      set({ accent: a.hex });
                    }}
                    title={a.name}
                    className={`relative h-8 w-8 border-2 transition hover:-translate-y-0.5 ${
                      on ? "border-[var(--ink)]" : "border-black/30"
                    }`}
                    style={{ background: a.hex }}
                  >
                    {on && (
                      <IconCheck
                        className="absolute inset-0 m-auto h-4 w-4"
                        style={{ color: relInk(a.hex) }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Row>

          <Row title="Tekstur Alas Meja" hint="Pola latar belakang di bawah meja potong.">
            <div className="grid grid-cols-5 gap-1.5">
              {PATTERNS.map((p) => {
                const on = settings.pattern === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      sfx.tick();
                      set({ pattern: p.id as Pattern });
                    }}
                    className={`flex flex-col items-center gap-1.5 border p-1.5 transition ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <span
                      className="h-7 w-full border border-black/20"
                      style={{
                        background:
                          p.id === "plain"
                            ? active.swatch[0]
                            : p.id === "aurora"
                              ? `radial-gradient(circle at 70% 20%, ${active.swatch[1]}, ${active.swatch[0]})`
                              : p.id === "dots"
                                ? `radial-gradient(${hexA(active.swatch[2], 0.6)} 1px, transparent 1px) ${active.swatch[0]}`
                                : p.id === "grid"
                                  ? `linear-gradient(${hexA(active.swatch[2], 0.5)} 1px, transparent 1px) ${active.swatch[0]}`
                                  : `repeating-linear-gradient(135deg, ${hexA(active.swatch[2], 0.5)} 0 1px, transparent 1px 6px) ${active.swatch[0]}`,
                        backgroundSize: p.id === "dots" ? "6px 6px" : p.id === "grid" ? "7px 7px" : undefined,
                      }}
                    />
                    <span className="font-mono text-[9px] font-bold uppercase text-[var(--ink-faint)]">
                      {p.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Row>

          <Row title="Suara & Efek" hint="Efek suara sintesis Web Audio dan partikel selebrasi.">
            <div className="flex flex-col gap-2">
              <Toggle
                on={settings.sound}
                onChange={(v) => set({ sound: v })}
                label="Efek Suara Mekanis"
                desc="Bunyi pisau potong, klik tombol, dan lonceng selesai"
                iconOn={<IconSound className="h-4 w-4" />}
                iconOff={<IconMute className="h-4 w-4" />}
              />
              <Toggle
                on={settings.particles}
                onChange={(v) => set({ particles: v })}
                label="Semburan Konfeti"
                desc="Partikel warna saat pemotongan atau salin alamat selesai"
                iconOn={<IconSpark className="h-4 w-4" />}
                iconOff={<IconSpark className="h-4 w-4" />}
              />
              <Toggle
                on={settings.motion}
                onChange={(v) => set({ motion: v })}
                label="Animasi Antarmuka"
                desc="Transisi laser potong dan indikator berkedip"
                iconOn={<IconBolt className="h-4 w-4" />}
                iconOff={<IconBolt className="h-4 w-4" />}
              />
            </div>
          </Row>

          <button
            type="button"
            onClick={() => {
              sfx.click();
              reset();
            }}
            className="az-btn az-btn-ghost h-10 w-full font-mono text-xs uppercase tracking-wider"
          >
            <IconRefresh className="h-4 w-4" />
            Kembalikan Setelan Awal
          </button>
        </div>
      </aside>
    </div>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function relInk(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  return L > 0.45 ? "#002147" : "#FFF6E4";
}
