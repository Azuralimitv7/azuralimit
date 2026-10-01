/* Celebration ambient FX — per-occasion motion design.
 * All effects are drawn locally on canvas. No images, no network.
 * Each celebration gets its own choreography: fireworks, lanterns,
 * petals, snow, embers, fireflies, confetti, etc.
 */

export type FxShape =
  | "spark"
  | "star"
  | "petal"
  | "leaf"
  | "snow"
  | "confetti"
  | "lantern"
  | "ember"
  | "ketupat"
  | "balloon"
  | "heart"
  | "dot"
  | "ribbon"
  | "feather";

export interface FireworksConfig {
  /** rockets launched per second */
  rate: number;
  colors: string[];
  /** explosion radius multiplier */
  power: number;
  /** max simultaneous rockets */
  maxRockets: number;
}

export interface DriftConfig {
  shapes: FxShape[];
  colors: string[];
  /** target alive particles */
  count: number;
  /** vertical speed px/s (positive = falling, negative handled by direction) */
  speed: [number, number];
  size: [number, number];
  /** horizontal sway amplitude px */
  sway: number;
}

export interface TwinkleConfig {
  count: number;
  colors: string[];
  size: [number, number];
}

export interface CelebrationFx {
  id: string;
  label: string;
  fireworks?: FireworksConfig;
  falling?: DriftConfig;
  rising?: DriftConfig;
  twinkle?: TwinkleConfig;
  embers?: { count: number; colors: string[] };
}

const GOLD = ["#D2B48C", "#C47623", "#FFF6E4"];
const RED_GOLD = ["#781C2E", "#C47623", "#D2B48C", "#FFF6E4"];
const RED_WHITE = ["#781C2E", "#FFF6E4", "#D2B48C"];
const GREEN_GOLD = ["#00594E", "#D2B48C", "#C47623", "#FFF6E4"];
const BLUE_GOLD = ["#124D95", "#E9F5FF", "#D2B48C", "#FFF6E4"];
const NAVY_GOLD = ["#002147", "#D2B48C", "#FFF6E4", "#C47623"];

export const CELEBRATION_FX: Record<string, CelebrationFx> = {
  "tahun-baru": {
    id: "tahun-baru",
    label: "Kembang api Tahun Baru",
    fireworks: { rate: 1.8, colors: ["#D2B48C", "#FFF6E4", "#C47623", "#E9F5FF", "#781C2E", "#00594E"], power: 1.4, maxRockets: 4 },
    twinkle: { count: 90, colors: ["#FFF6E4", "#D2B48C", "#E9F5FF"], size: [1, 3] },
    falling: { shapes: ["spark", "star"], colors: GOLD, count: 24, speed: [30, 80], size: [1.5, 3.5], sway: 24 },
  },
  "isra-mikraj": {
    id: "isra-mikraj",
    label: "Bintang & cahaya naik",
    twinkle: { count: 130, colors: ["#E9F5FF", "#FFF6E4", "#D2B48C"], size: [1, 3.2] },
    rising: { shapes: ["dot", "star"], colors: ["#D2B48C", "#FFF6E4", "#7fd6c2"], count: 26, speed: [18, 45], size: [1.5, 4], sway: 30 },
  },
  imlek: {
    id: "imlek",
    label: "Lampion terbang & petasan",
    fireworks: { rate: 0.9, colors: RED_GOLD, power: 1.0, maxRockets: 3 },
    rising: { shapes: ["lantern"], colors: ["#781C2E", "#C47623", "#D2B48C"], count: 16, speed: [22, 50], size: [14, 26], sway: 36 },
    falling: { shapes: ["petal", "confetti"], colors: ["#781C2E", "#D2B48C", "#FFF6E4", "#C47623"], count: 34, speed: [40, 95], size: [4, 9], sway: 42 },
  },
  ramadan: {
    id: "ramadan",
    label: "Kunang-kunang & lentera",
    twinkle: { count: 70, colors: GOLD, size: [1, 3] },
    rising: { shapes: ["lantern", "dot"], colors: ["#D2B48C", "#C47623", "#FFF6E4"], count: 18, speed: [16, 40], size: [10, 22], sway: 28 },
    embers: { count: 26, colors: ["#D2B48C", "#C47623", "#FFF6E4"] },
  },
  nyepi: {
    id: "nyepi",
    label: "Hening — bintang redup",
    twinkle: { count: 45, colors: ["#E9F5FF", "#D2B48C"], size: [1, 2.2] },
    falling: { shapes: ["dot"], colors: ["#E9F5FF"], count: 10, speed: [6, 16], size: [1, 2], sway: 12 },
  },
  "idul-fitri": {
    id: "idul-fitri",
    label: "Ketupat & confetti hijau-emas",
    fireworks: { rate: 0.35, colors: GREEN_GOLD, power: 0.9, maxRockets: 2 },
    falling: { shapes: ["ketupat", "confetti", "petal"], colors: ["#00594E", "#D2B48C", "#C47623", "#FFF6E4"], count: 46, speed: [45, 100], size: [5, 11], sway: 46 },
    rising: { shapes: ["dot", "star"], colors: GOLD, count: 14, speed: [18, 40], size: [1.5, 3.5], sway: 22 },
  },
  "jumat-agung": {
    id: "jumat-agung",
    label: "Daun zaitun gugur perlahan",
    falling: { shapes: ["leaf"], colors: ["#00594E", "#D2B48C", "#352323"], count: 24, speed: [18, 45], size: [6, 12], sway: 34 },
    twinkle: { count: 20, colors: ["#D2B48C"], size: [1, 2] },
  },
  paskah: {
    id: "paskah",
    label: "Kelopak lili & cahaya pagi",
    falling: { shapes: ["petal"], colors: ["#FFF6E4", "#E9F5FF", "#D2B48C"], count: 36, speed: [30, 70], size: [5, 10], sway: 40 },
    rising: { shapes: ["dot", "feather"], colors: ["#FFF6E4", "#D2B48C"], count: 16, speed: [16, 38], size: [2, 6], sway: 26 },
    twinkle: { count: 40, colors: ["#FFF6E4", "#D2B48C"], size: [1, 2.5] },
  },
  kartini: {
    id: "kartini",
    label: "Melati beterbangan",
    falling: { shapes: ["petal", "star"], colors: ["#FFF6E4", "#D2B48C", "#781C2E"], count: 38, speed: [32, 75], size: [4, 9], sway: 44 },
    rising: { shapes: ["dot"], colors: ["#D2B48C"], count: 12, speed: [14, 32], size: [1.5, 3], sway: 20 },
  },
  buruh: {
    id: "buruh",
    label: "Percikan semangat kerja",
    embers: { count: 34, colors: ["#C47623", "#D2B48C", "#FFF6E4"] },
    falling: { shapes: ["confetti", "dot"], colors: ["#C47623", "#D2B48C", "#FFF6E4"], count: 22, speed: [50, 110], size: [3, 7], sway: 30 },
  },
  pendidikan: {
    id: "pendidikan",
    label: "Kertas & balon ilmu",
    falling: { shapes: ["confetti", "petal"], colors: ["#124D95", "#D2B48C", "#FFF6E4", "#E9F5FF"], count: 32, speed: [35, 80], size: [4, 9], sway: 38 },
    rising: { shapes: ["balloon"], colors: ["#124D95", "#00594E", "#C47623"], count: 10, speed: [20, 42], size: [12, 22], sway: 30 },
  },
  kenaikan: {
    id: "kenaikan",
    label: "Bulu merpati naik ke cahaya",
    rising: { shapes: ["feather", "dot"], colors: ["#FFFFFF", "#E9F5FF", "#D2B48C"], count: 30, speed: [22, 55], size: [4, 10], sway: 44 },
    twinkle: { count: 50, colors: ["#FFF6E4", "#E9F5FF"], size: [1, 2.6] },
  },
  kebangkitan: {
    id: "kebangkitan",
    label: "Daun tunas & sinar",
    rising: { shapes: ["leaf", "dot"], colors: ["#00594E", "#D2B48C", "#C47623"], count: 28, speed: [20, 48], size: [4, 9], sway: 36 },
    falling: { shapes: ["petal"], colors: ["#D2B48C", "#781C2E"], count: 14, speed: [25, 55], size: [3, 7], sway: 30 },
  },
  "idul-adha": {
    id: "idul-adha",
    label: "Kilau geometris emas",
    twinkle: { count: 80, colors: GOLD, size: [1, 3] },
    falling: { shapes: ["star", "confetti"], colors: GOLD, count: 30, speed: [30, 70], size: [3, 8], sway: 36 },
    rising: { shapes: ["dot"], colors: GOLD, count: 14, speed: [16, 36], size: [1.5, 3.5], sway: 22 },
  },
  waisak: {
    id: "waisak",
    label: "Lentera teratai naik",
    rising: { shapes: ["lantern"], colors: ["#D2B48C", "#C47623", "#FFF6E4"], count: 18, speed: [14, 34], size: [12, 24], sway: 26 },
    embers: { count: 24, colors: ["#D2B48C", "#FFF6E4"] },
    twinkle: { count: 50, colors: ["#FFF6E4", "#D2B48C"], size: [1, 2.5] },
  },
  pancasila: {
    id: "pancasila",
    label: "Bintang emas & pita",
    twinkle: { count: 70, colors: ["#D2B48C", "#FFF6E4"], size: [1, 3] },
    falling: { shapes: ["star", "ribbon"], colors: RED_WHITE, count: 28, speed: [30, 70], size: [4, 9], sway: 40 },
  },
  lingkungan: {
    id: "lingkungan",
    label: "Daun & gelembung air",
    falling: { shapes: ["leaf"], colors: ["#00594E", "#124D95", "#D2B48C"], count: 44, speed: [35, 85], size: [5, 11], sway: 48 },
    rising: { shapes: ["dot"], colors: ["#124D95", "#E9F5FF"], count: 16, speed: [18, 40], size: [2, 5], sway: 24 },
  },
  hijriah: {
    id: "hijriah",
    label: "Langit bintang & meteor",
    twinkle: { count: 130, colors: ["#E9F5FF", "#FFF6E4", "#D2B48C"], size: [1, 3] },
    falling: { shapes: ["star"], colors: ["#FFF6E4", "#D2B48C"], count: 16, speed: [90, 200], size: [1.5, 3], sway: 8 },
    rising: { shapes: ["dot"], colors: ["#D2B48C"], count: 14, speed: [14, 30], size: [1.5, 3], sway: 20 },
  },
  anak: {
    id: "anak",
    label: "Balon & layang-layang",
    rising: { shapes: ["balloon"], colors: ["#124D95", "#781C2E", "#00594E", "#C47623"], count: 16, speed: [24, 55], size: [12, 24], sway: 40 },
    falling: { shapes: ["confetti", "star"], colors: ["#124D95", "#C47623", "#781C2E", "#00594E", "#FFF6E4"], count: 36, speed: [45, 95], size: [4, 9], sway: 44 },
  },
  pramuka: {
    id: "pramuka",
    label: "Daun hutan & kunang-kunang",
    falling: { shapes: ["leaf"], colors: ["#00594E", "#352323", "#D2B48C"], count: 34, speed: [30, 75], size: [5, 11], sway: 46 },
    embers: { count: 22, colors: ["#D2B48C", "#C47623"] },
  },
  kemerdekaan: {
    id: "kemerdekaan",
    label: "Konfeti merah-putih & kembang api",
    fireworks: { rate: 1.3, colors: ["#781C2E", "#FFF6E4", "#D2B48C", "#C47623"], power: 1.25, maxRockets: 3 },
    falling: { shapes: ["confetti", "ribbon"], colors: RED_WHITE, count: 56, speed: [55, 120], size: [4, 10], sway: 50 },
    twinkle: { count: 40, colors: ["#FFF6E4", "#D2B48C"], size: [1, 2.5] },
  },
  maulid: {
    id: "maulid",
    label: "Ornamen hijau teduh",
    twinkle: { count: 60, colors: ["#00594E", "#D2B48C"], size: [1, 2.8] },
    rising: { shapes: ["dot", "star"], colors: ["#00594E", "#D2B48C"], count: 22, speed: [14, 34], size: [1.5, 4], sway: 26 },
    falling: { shapes: ["petal"], colors: ["#00594E", "#D2B48C"], count: 18, speed: [22, 50], size: [4, 8], sway: 32 },
  },
  olahraga: {
    id: "olahraga",
    label: "Semangat lintasan",
    fireworks: { rate: 0.4, colors: BLUE_GOLD, power: 0.9, maxRockets: 2 },
    falling: { shapes: ["confetti"], colors: ["#124D95", "#D2B48C", "#FFF6E4", "#C47623"], count: 44, speed: [80, 160], size: [4, 9], sway: 36 },
  },
  "kesaktian-pancasila": {
    id: "kesaktian-pancasila",
    label: "Debu emas khidmat",
    twinkle: { count: 50, colors: ["#D2B48C"], size: [1, 2.4] },
    falling: { shapes: ["dot"], colors: ["#D2B48C"], count: 18, speed: [10, 26], size: [1, 2.5], sway: 16 },
  },
  batik: {
    id: "batik",
    label: "Titik lilin melayang",
    twinkle: { count: 55, colors: ["#D2B48C", "#C47623"], size: [1, 2.6] },
    falling: { shapes: ["dot", "petal"], colors: ["#D2B48C", "#C47623"], count: 22, speed: [14, 36], size: [2, 5], sway: 28 },
  },
  "sumpah-pemuda": {
    id: "sumpah-pemuda",
    label: "Pita persatuan",
    falling: { shapes: ["ribbon", "confetti"], colors: RED_WHITE, count: 42, speed: [45, 100], size: [4, 10], sway: 48 },
    rising: { shapes: ["dot"], colors: ["#D2B48C"], count: 12, speed: [16, 34], size: [1.5, 3], sway: 20 },
  },
  pahlawan: {
    id: "pahlawan",
    label: "Bara api ingatan",
    embers: { count: 46, colors: ["#C47623", "#D2B48C", "#781C2E", "#FFF6E4"] },
    twinkle: { count: 40, colors: ["#D2B48C"], size: [1, 2.4] },
  },
  guru: {
    id: "guru",
    label: "Kertas & bunga terima kasih",
    falling: { shapes: ["confetti", "petal"], colors: ["#00594E", "#D2B48C", "#FFF6E4"], count: 36, speed: [35, 80], size: [4, 9], sway: 40 },
    rising: { shapes: ["dot"], colors: ["#D2B48C"], count: 12, speed: [14, 30], size: [1.5, 3], sway: 20 },
  },
  ibu: {
    id: "ibu",
    label: "Kelopak kasih sayang",
    falling: { shapes: ["petal", "heart"], colors: ["#781C2E", "#D2B48C", "#FFF6E4"], count: 42, speed: [30, 75], size: [4, 10], sway: 46 },
    rising: { shapes: ["heart", "dot"], colors: ["#781C2E", "#D2B48C"], count: 12, speed: [16, 36], size: [3, 7], sway: 28 },
  },
  natal: {
    id: "natal",
    label: "Salju & lampu natal",
    falling: { shapes: ["snow"], colors: ["#FFFFFF", "#E9F5FF"], count: 90, speed: [30, 80], size: [1.5, 4.5], sway: 36 },
    twinkle: { count: 70, colors: ["#C47623", "#D2B48C", "#781C2E", "#FFF6E4"], size: [1.5, 3.5] },
    fireworks: { rate: 0.25, colors: ["#C47623", "#D2B48C", "#FFF6E4", "#00594E"], power: 0.85, maxRockets: 2 },
  },
};

export function fxForCelebration(id: string | null | undefined): CelebrationFx | null {
  if (!id) return null;
  return CELEBRATION_FX[id] ?? null;
}

/** Scale particle density for calm mode / small screens / low power. */
export function densityFor(level: string, width: number): number {
  let d = level === "lembut" ? 0.35 : 1;
  if (width < 640) d *= 0.6;
  else if (width < 1024) d *= 0.8;
  return d;
}
