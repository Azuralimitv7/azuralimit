import catalogue from "./celebrations.json";

export type CelebrationCategory = "nasional" | "keagamaan" | "peringatan" | "musim";
export type CelebrationMotion = "sway" | "float" | "quiet" | "spark" | "turn";

export interface Celebration {
  id: string;
  occasion: string;
  artTitle: string;
  category: CelebrationCategory;
  nationalHoliday: boolean;
  dateLabel: string;
  dates2026: string[];
  description: string;
  motif: string;
  motion: CelebrationMotion;
  palette: { bg: string; surface: string; ink: string; accent: string; secondary: string };
}

/** Calendar references are intentionally pinned, not calculated for future years. */
export const CALENDAR_YEAR = 2026;
export const CALENDAR_SOURCE = "https://www.kemenkopmk.go.id/pemerintah-tetapkan-17-hari-libur-nasional-dan-8-hari-cuti-bersama-tahun-2026";
export const CELEBRATIONS = catalogue as Celebration[];
export const CATEGORY_LABELS: Record<CelebrationCategory, string> = {
  nasional: "Nasional",
  keagamaan: "Keagamaan",
  peringatan: "Hari peringatan",
  musim: "Suasana Ramadan",
};

/** All URLs are repo-owned, same-origin SVG assets; never a CDN or remote API. */
export function celebrationAssets(id: string) {
  const safe = CELEBRATIONS.some((entry) => entry.id === id) ? id : CELEBRATIONS[0].id;
  return {
    poster: `/assets/celebrations/${safe}/poster.svg`,
    motif: `/assets/celebrations/${safe}/motif.svg`,
    pattern: `/assets/celebrations/${safe}/pattern.svg`,
  };
}

export function occasionStatus(celebration: Celebration): string {
  return celebration.nationalHoliday
    ? "Libur nasional"
    : celebration.category === "musim"
      ? "Suasana perayaan · bukan penetapan libur"
      : "Hari peringatan · bukan libur nasional";
}

export function searchCelebrations(query: string, category: CelebrationCategory | "all" = "all") {
  const words = query.trim().toLocaleLowerCase("id").split(/\s+/).filter(Boolean);
  return CELEBRATIONS.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    const haystack = `${entry.occasion} ${entry.artTitle} ${entry.description} ${entry.motif} ${entry.dateLabel}`.toLocaleLowerCase("id");
    return words.every((word) => haystack.includes(word));
  });
}
