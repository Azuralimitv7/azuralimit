import { celebrationAssets, type Celebration } from "@/lib/celebrations";

/** Repo-owned SVGs stay static by themselves; motion is controlled by page CSS. */
export default function CelebrationArtwork({ celebration, animate = true, className = "", priority = false }: {
  celebration: Celebration;
  animate?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const assets = celebrationAssets(celebration.id);
  return (
    <div className={`celebration-art ${className}`} data-movement={celebration.motion} data-animate={animate ? "on" : "off"} style={{ backgroundColor: celebration.palette.bg }}>
      <img className="celebration-poster" src={assets.poster} width={760} height={420} alt={`${celebration.artTitle}: ${celebration.motif.toLocaleLowerCase("id")}. Ilustrasi ${celebration.occasion}.`} loading={priority ? "eager" : "lazy"} decoding="async" />
      {animate && <div className="celebration-ornaments" aria-hidden="true">
        <img className="celebration-ornament celebration-ornament-a" src={assets.motif} alt="" width={240} height={300} />
        <img className="celebration-ornament celebration-ornament-b" src={assets.motif} alt="" width={240} height={300} />
      </div>}
    </div>
  );
}
