"use client";

import { CELEBRATIONS, occasionStatus } from "@/lib/celebrations";
import { fxForCelebration } from "@/lib/celebrationFx";
import { themeById } from "@/lib/theme";
import { sfx } from "@/lib/sound";
import CelebrationArtwork from "./CelebrationArtwork";
import { useAzura } from "./ThemeProvider";
import { IconChevronR, IconSliders } from "./Icons";

const FEATURED_IDS = ["idul-fitri", "kemerdekaan", "imlek", "waisak"];
const featured = FEATURED_IDS.map((id) => CELEBRATIONS.find((entry) => entry.id === id)!);

export default function CelebrationBanner({ onOpenThemes }: { onOpenThemes: () => void }) {
  const { settings, chooseTheme, set, triggerAmbient } = useAzura();
  const occasion = themeById(settings.theme).celebration;

  if (occasion && !settings.decorations) {
    return <section className="celebration-ribbon" aria-label="Tema hari besar aktif">
      <div><span className="festival-eyebrow">ALMANAK NUSANTARA / TEMA PILIHAN</span><p>{occasion.occasion} <span>— {occasion.artTitle}</span></p></div>
      <button type="button" onClick={() => set({ decorations: true })} className="az-btn az-btn-ghost px-3 py-2 text-xs">Tampilkan ilustrasi</button>
      <button type="button" onClick={onOpenThemes} className="az-icon-btn h-9 w-9" aria-label="Ganti tema hari besar"><IconSliders className="h-4 w-4" /></button>
    </section>;
  }

  if (occasion) {
    const sequence = CELEBRATIONS.findIndex((item) => item.id === occasion.id) + 1;
    const fx = fxForCelebration(occasion.id);
    return <section className="celebration-banner" aria-label={`Tema pilihan: ${occasion.occasion}`}>
      <div className="celebration-copy">
        <span className="festival-eyebrow">ALMANAK NUSANTARA <span>NO. {String(sequence).padStart(2,"0")} / 30</span></span>
        <p className="celebration-occasion">{occasion.occasion}</p>
        <h2 className="font-display">{occasion.artTitle}.</h2>
        <p className="celebration-description">{occasion.description}</p>
        <div className="celebration-copy-footer">
          <button type="button" onClick={() => { sfx.click(); onOpenThemes(); }} className="az-btn az-btn-ghost px-3 py-2 text-xs">Jelajahi 30 tema <IconChevronR className="h-3 w-3" /></button>
          <span>{occasion.dateLabel}<br /><small>{occasionStatus(occasion)}</small></span>
        </div>
      </div>
      <div className="celebration-picture">
        <CelebrationArtwork celebration={occasion} animate={settings.motion} priority />
        <div className="celebration-caption"><span>{occasion.motif}</span><span>ILUSTRASI LOKAL / SVG</span></div>
      </div>
      <div className="celebration-bottomline">
        <span>{fx ? `EFEK LATAR: ${fx.label.toUpperCase()}` : "Tema dipilih manual; tidak menandai hari ini sebagai hari libur."}</span>
        <span className="celebration-fx-quick" role="group" aria-label="Intensitas efek latar">
          {(["meriah", "lembut", "mati"] as const).map((level) => (
            <button key={level} type="button" aria-pressed={settings.fx === level} onClick={() => { sfx.tick(); set({ fx: level }); }}>{level}</button>
          ))}
        </span>
        <button type="button" className="celebration-trigger" onClick={() => {
          sfx.chime();
          triggerAmbient(occasion.id);
        }}>Nyalakan efek</button>
        <button type="button" onClick={() => set({ decorations: false })}>Sembunyikan dekorasi</button>
      </div>
    </section>;
  }

  // A compact, discoverable shelf; the familiar workbench remains the main focus.
  return <section className="festival-shelf" aria-label="Koleksi tema hari besar Indonesia">
    <div className="festival-shelf-intro">
      <span className="festival-eyebrow">KOLEKSI BARU / 30 ILUSTRASI</span>
      <h2 className="font-display">Warna-warni<br />hari yang berarti.</h2>
      <p>Hari besar Indonesia, digambar khusus untuk meja kerjamu.</p>
      <button type="button" onClick={() => { sfx.click(); onOpenThemes(); }} className="festival-text-link">Buka almanak tema <IconChevronR className="h-3.5 w-3.5" /></button>
    </div>
    <div className="festival-shelf-cards">
      {featured.map((entry) => <button type="button" key={entry.id} className="festival-mini-card" onClick={() => { sfx.click(); chooseTheme(entry.id); }} aria-label={`Pakai tema ${entry.occasion}`}>
        <CelebrationArtwork celebration={entry} animate={false} />
        <span className="festival-mini-title">{entry.occasion}<IconChevronR className="h-3 w-3" /></span>
        <small>{entry.motif.split(" · ").slice(0,2).join(" & ")}</small>
      </button>)}
    </div>
    <div className="festival-shelf-foot"><span>SVG orisinal · aset lokal · tanpa CDN</span><span>16 perayaan libur nasional + 14 suasana & peringatan</span></div>
  </section>;
}
