"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENTS, HOLIDAY_THEMES, PATTERNS, STUDIO_THEMES, THEMES, alphaHex, inkOn, themeById, type ThemeDef } from "@/lib/theme";
import { CALENDAR_SOURCE, CALENDAR_YEAR, CATEGORY_LABELS, celebrationAssets, occasionStatus, searchCelebrations, type CelebrationCategory } from "@/lib/celebrations";
import { sfx } from "@/lib/sound";
import { useAzura } from "./ThemeProvider";
import CelebrationArtwork from "./CelebrationArtwork";
import { IconCheck, IconDownload, IconRefresh, IconSliders, IconX } from "./Icons";

type Tab = "holiday" | "studio" | "favorites" | "preferences";
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function Bookmark({ filled = false }: { filled?: boolean }) {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z" /></svg>;
}
function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (value: boolean) => void; label: string; hint: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => { sfx.snap(); onChange(!on); }} className="festival-preference-toggle">
    <span><strong>{label}</strong><small>{hint}</small></span>
    <span className="festival-switch" data-on={on}><span /></span>
  </button>;
}

export default function ThemeSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, set, reset, chooseTheme, toggleFavorite, reducedMotion } = useAzura();
  const [tab, setTab] = useState<Tab>("holiday");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CelebrationCategory | "all">("all");
  const [month, setMonth] = useState("all");
  const [onlyHolidays, setOnlyHolidays] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  // Keyboard focus stays in the drawer; close restores the original trigger.
  useEffect(() => {
    if (!open) return;
    const original = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>('[aria-label="Tutup pengaturan"]')?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], summary') || []).filter((el) => el.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown, true);
      if (original?.isConnected) original.focus({ preventScroll: true });
    };
  }, [open]);

  const active = themeById(settings.theme);
  const visible = useMemo(() => {
    if (tab === "holiday") {
      const matches = new Set(searchCelebrations(query, category).map((entry) => entry.id));
      return HOLIDAY_THEMES.filter((theme) => matches.has(theme.id) && (!onlyHolidays || theme.celebration!.nationalHoliday) && (month === "all" || theme.celebration!.dates2026.some((date) => Number(date.slice(5,7)) === Number(month))));
    }
    const list = tab === "favorites" ? THEMES.filter((theme) => settings.favorites.includes(theme.id)) : STUDIO_THEMES;
    return list.filter((theme) => `${theme.name} ${theme.blurb}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")));
  }, [tab, query, category, month, onlyHolidays, settings.favorites]);

  const changeTab = (next: Tab) => {
    sfx.tick(); setTab(next); setQuery(""); setCategory("all"); setMonth("all"); setOnlyHolidays(false);
  };
  const pick = (theme: ThemeDef) => { sfx.click(); chooseTheme(theme.id); };

  if (!open) return null;
  const selectedArt = active.celebration || HOLIDAY_THEMES.find((theme) => theme.id === "idul-fitri")!.celebration!;

  return <div className="festival-settings-backdrop az-veil" onClick={onClose}>
    <aside ref={dialogRef} className="festival-settings az-slide-left" role="dialog" aria-modal="true" aria-labelledby="theme-drawer-title" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
      <header className="festival-settings-header">
        <div className="festival-header-seal" aria-hidden="true"><IconSliders className="h-5 w-5" /></div>
        <div><span className="festival-eyebrow">AZURALIMIT / RAK TEMA</span><h2 className="font-display" id="theme-drawer-title">Almanak Nusantara.</h2></div>
        <button type="button" className="az-icon-btn h-9 w-9 shrink-0" onClick={onClose} aria-label="Tutup pengaturan"><IconX className="h-4 w-4" /></button>
      </header>
      <nav className="festival-tabs" aria-label="Bagian pengaturan">
        {([['holiday','Hari besar',30],['studio','Studio',10],['favorites','Favorit',settings.favorites.length],['preferences','Preferensi',null]] as const).map(([id,label,count]) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => changeTab(id)}>{label}{count !== null && <span>{count}</span>}</button>)}
      </nav>

      <div className="festival-settings-scroll az-scroll">
        {tab !== "preferences" && <>
          {tab === "holiday" && <div className="festival-gallery-intro">
            <div><span className="festival-eyebrow">DIGAMBAR DI STUDIO, BUKAN DIUNDUH</span><h3 className="font-display">Setiap perayaan,<br />punya ceritanya sendiri.</h3><p>30 ilustrasi orisinal. Palet hangat, motif khas, dan gerak yang tidak merebut perhatian.</p><span className="festival-offline-note"><span /> Semua aset SVG tersedia lokal</span></div>
            <div className="festival-gallery-intro-art"><CelebrationArtwork celebration={selectedArt} animate={settings.motion && settings.decorations} priority /><span>{selectedArt.artTitle}</span></div>
          </div>}
          {tab === "studio" && <div className="festival-section-heading"><span className="festival-eyebrow">KOLEKSI INTI / 10 TEMA</span><h3 className="font-display">Warna untuk sehari-hari.</h3><p>Pilihan meja kerja klasik tanpa ornamen perayaan.</p></div>}
          {tab === "favorites" && <div className="festival-section-heading"><span className="festival-eyebrow">DISIMPAN DI PERANGKAT INI</span><h3 className="font-display">Pilihan yang ingin kamu simpan.</h3><p>Klik penanda pada kartu untuk menambah atau menghapus favorit.</p></div>}

          <div className="festival-gallery-controls">
            <div className="festival-search-row">
              <label className="festival-search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6.5" /><path d="m15 15 5 5" /></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Idulfitri, kemerdekaan, batik…" aria-label="Cari tema" />{query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery("")}><IconX className="h-3.5 w-3.5" /></button>}</label>
              {tab === "holiday" && <select className="festival-month" aria-label="Bulan perayaan" value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">Semua bulan</option>{MONTHS.map((label,i) => <option key={label} value={i+1}>{label}</option>)}</select>}
            </div>
            {tab === "holiday" && <div className="festival-filters" aria-label="Kategori tema">
              <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>Semua</button>
              {(Object.entries(CATEGORY_LABELS) as [CelebrationCategory,string][]).map(([id,label]) => <button type="button" key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
            </div>}
            <div className="festival-gallery-summary"><output aria-live="polite">{visible.length} tema{tab === "holiday" ? " dalam koleksi" : " tersedia"}</output>{tab === "holiday" && <label><input type="checkbox" checked={onlyHolidays} onChange={(event) => setOnlyHolidays(event.target.checked)} /> Hanya libur nasional</label>}</div>
          </div>

          {visible.length ? <div className="festival-theme-grid">
            {visible.map((theme) => {
              const isActive = settings.theme === theme.id;
              const favorite = settings.favorites.includes(theme.id);
              return <article className="festival-theme-card" key={theme.id} data-selected={isActive} data-theme-card={theme.id}>
                <button type="button" className="festival-theme-pick" onClick={() => pick(theme)} aria-label={`Pakai tema ${theme.name}`} aria-pressed={isActive}>
                  {theme.celebration ? <CelebrationArtwork celebration={theme.celebration} animate={false} /> : <div className="festival-studio-swatch" style={{ background: theme.swatch[0] }}><span style={{ background: theme.swatch[1] }} /><span style={{ background: theme.swatch[2] }} /><i style={{ color: inkOn(theme.swatch[0]) }}>Aa<span>01 / STUDIO</span></i></div>}
                  <div className="festival-theme-card-copy"><span className="festival-card-meta">{theme.celebration ? theme.celebration.dateLabel : theme.mode === "light" ? "TEMA TERANG" : "TEMA GELAP"}</span><h4>{theme.name}</h4><p>{theme.celebration?.artTitle || theme.blurb}</p><span className="festival-card-bottom"><span className="festival-color-dots" aria-hidden="true">{theme.swatch.map((color,i) => <i key={i} style={{ background: color }} />)}</span><span>{isActive ? <><IconCheck className="h-3 w-3" /> Dipakai</> : "Pilih tema →"}</span></span></div>
                </button>
                <button type="button" className="festival-favorite" aria-label={`${favorite ? "Hapus" : "Simpan"} ${theme.name} ${favorite ? "dari" : "ke"} favorit`} aria-pressed={favorite} onClick={() => { sfx.tick(); toggleFavorite(theme.id); }}><Bookmark filled={favorite} /></button>
              </article>;
            })}
          </div> : <div className="festival-no-results"><Bookmark /><h3 className="font-display">{tab === "favorites" ? "Belum ada tema di rak ini." : "Belum ada yang cocok."}</h3><p>{tab === "favorites" ? "Tandai tema kesukaanmu dari koleksi Hari besar atau Studio." : "Coba nama lain, ganti bulan, atau tampilkan semua kategori."}</p><button type="button" className="az-btn az-btn-ghost px-4 py-2 text-xs" onClick={() => changeTab("holiday")}>Lihat semua tema</button></div>}

          <details className="festival-catalogue-note"><summary>Tentang kalender &amp; aset lokal</summary><p>Koleksi mencakup seluruh 16 momen libur nasional (17 hari pada {CALENDAR_YEAR}), 13 hari peringatan, dan suasana Ramadan. Hari peringatan bukan otomatis hari libur; cuti bersama mengikuti perayaannya dan tidak menjadi tema terpisah. Pilihan tema selalu manual.</p><p>Tanggal hari raya yang bergerak hanya ditampilkan untuk kalender {CALENDAR_YEAR}; bukan perhitungan untuk tahun lain. Acuan: <a href={CALENDAR_SOURCE} target="_blank" rel="noreferrer">pengumuman Kemenko PMK</a>. Referensi tidak perlu diakses untuk memakai tema.</p><p>Poster, ornamen, dan pola dibuat sebagai SVG lokal. Tidak ada CDN, emoji, pelacak, atau unduhan aset dari situs luar saat memilih tema.</p></details>
        </>}

        {tab === "preferences" && <div className="festival-preferences">
          <div className="festival-section-heading"><span className="festival-eyebrow">SESUAIKAN DENGAN CARA KERJAMU</span><h3 className="font-display">Semarak, atau lebih tenang.</h3><p>Pengaturan diterapkan langsung, tanpa mengubah posisi dan hasil potongan gambar.</p></div>
          <section><h4>Suasana latar perayaan</h4><p>Kembang api, lampion terbang, salju, dan konfeti yang disesuaikan tiap perayaan. Digambar lokal di canvas — tanpa video atau GIF dari luar.</p>
            <div className="festival-fx-options" role="group" aria-label="Intensitas efek latar">
              {([["meriah", "Meriah", "Pesta penuh: kembang api + hujan motif"], ["lembut", "Lembut", "Gerak pelan, jumlah partikel sedikit"], ["mati", "Mati", "Tanpa animasi latar"]] as const).map(([id, label, hint]) => (
                <button key={id} type="button" aria-pressed={settings.fx === id} onClick={() => { sfx.tick(); set({ fx: id }); }}><strong>{label}</strong><small>{hint}</small></button>
              ))}
            </div>
          </section>
          <section><h4>Dekorasi &amp; gerakan</h4>
            <Toggle on={settings.decorations} onChange={(value) => set({ decorations: value })} label="Ilustrasi perayaan" hint="Banner bergambar, ornamen, dan animasi latar; matikan untuk meja yang ringkas." />
            <Toggle on={settings.motion} onChange={(value) => set({ motion: value })} label="Animasi antarmuka" hint="Lampion berayun, kembang api meledak, dan ornamen melayang." />
            {reducedMotion && <p className="festival-motion-notice">Perangkatmu meminta gerakan dikurangi. Animasi latar dan konfeti tidak dijalankan, meski sakelar aktif.</p>}
            <Toggle on={settings.particles} onChange={(value) => set({ particles: value })} label="Konfeti selesai memotong" hint="Hanya saat aksi selesai; tidak ada partikel yang terus menghujani layar." />
            <Toggle on={settings.sound} onChange={(value) => set({ sound: value })} label="Efek suara mekanis" hint="Suara sintetis lokal. Tidak ada musik atau berkas audio dari luar." />
          </section>
          <section><h4>Warna aksen</h4><p>Mengubah warna kontrol, bukan warna ilustrasi asli.</p><div className="festival-accent-options"><button type="button" onClick={() => set({ accent: null })} aria-pressed={settings.accent === null} className="az-btn az-btn-ghost px-3 py-2 text-xs">Palet asli tema</button>{ACCENTS.map((accent) => <button type="button" key={accent.hex} title={accent.name} aria-label={`Aksen ${accent.name}`} aria-pressed={settings.accent === accent.hex} onClick={() => { sfx.tick(); set({ accent: accent.hex }); }} style={{ background: accent.hex, color: inkOn(accent.hex) }}>{settings.accent === accent.hex && <IconCheck className="h-4 w-4" />}</button>)}</div></section>
          <section><h4>Tekstur latar</h4><p>Motif SVG mengikuti perayaan. Pilih Polos bila ingin tanpa pola.</p><div className="festival-pattern-options">{PATTERNS.map((pattern) => <button type="button" key={pattern.id} onClick={() => set({ pattern: pattern.id })} aria-pressed={settings.pattern === pattern.id}><span style={{ backgroundColor: active.swatch[0], backgroundImage: pattern.id === "heritage" ? `url("${celebrationAssets(active.celebration?.id || "batik").pattern}")` : pattern.id === "plain" ? "none" : pattern.id === "dots" ? `radial-gradient(${alphaHex(active.swatch[2], .65)} 1px, transparent 1px)` : pattern.id === "beams" ? `repeating-linear-gradient(135deg, ${alphaHex(active.swatch[2], .4)} 0 1px, transparent 1px 8px)` : `linear-gradient(${alphaHex(active.swatch[2], .3)} 1px, transparent 1px),linear-gradient(90deg,${alphaHex(active.swatch[2], .3)} 1px,transparent 1px)`, backgroundSize: pattern.id === "heritage" ? "44px 44px" : "10px 10px" }} />{pattern.name}</button>)}</div></section>
          {active.celebration && <section className="festival-original-download"><h4>Ilustrasi ini milik proyekmu.</h4><p>File SVG asli tersimpan di repositori, dapat diedit dan dipakai tanpa ketergantungan layanan gambar.</p><a href={celebrationAssets(active.id).poster} download={`azuralimit-${active.id}.svg`} className="az-btn az-btn-ghost px-3 py-2 text-xs"><IconDownload className="h-3.5 w-3.5" /> Unduh ilustrasi SVG</a></section>}
          <button type="button" className="az-btn az-btn-ghost px-4 py-3 text-xs" onClick={() => { sfx.click(); reset(); }}><IconRefresh className="h-3.5 w-3.5" /> Kembalikan tampilan awal (favorit tetap disimpan)</button>
        </div>}
      </div>
      <footer className="festival-settings-footer"><div><span className="festival-active-dot" /><span><small>SEDANG DIPAKAI</small><strong aria-live="polite">{active.name}</strong></span></div><button type="button" className="az-btn az-btn-primary px-5 py-2.5 text-xs" onClick={onClose}>Selesai <IconCheck className="h-3.5 w-3.5" /></button></footer>
    </aside>
  </div>;
}
