import { CELEBRATIONS, type Celebration } from "./celebrations";

export interface ThemeDef {
  id: string;
  name: string;
  mode: "dark" | "light";
  blurb: string;
  swatch: [string, string, string];
  celebration?: Celebration;
}

export const STUDIO_THEMES: ThemeDef[] = [
  { id: "midnight", name: "Azura Midnight", mode: "dark", blurb: "Biru malam dan aksen tembaga. Meja kerja khas Azuralimit.", swatch: ["#002147", "#124D95", "#C47623"] },
  { id: "lagoon", name: "Teal Lagoon", mode: "dark", blurb: "Hijau laut yang dalam, ditemani warna pasir hangat.", swatch: ["#003B33", "#00594E", "#D2B48C"] },
  { id: "sapphire", name: "Royal Sapphire", mode: "dark", blurb: "Biru safir dengan detail tembaga yang tegas.", swatch: ["#0D3A6E", "#124D95", "#C47623"] },
  { id: "velvet", name: "Velvet Wine", mode: "dark", blurb: "Merah anggur dan emas antik untuk suasana yang hangat.", swatch: ["#4D1120", "#781C2E", "#D2B48C"] },
  { id: "espresso", name: "Espresso Umber", mode: "dark", blurb: "Cokelat kopi yang teduh untuk bekerja di malam hari.", swatch: ["#1E1310", "#352323", "#C47623"] },
  { id: "obsidian", name: "Obsidian Ink", mode: "dark", blurb: "Latar tinta gelap untuk menikmati warna gambar.", swatch: ["#06101F", "#002147", "#D2B48C"] },
  { id: "glacier", name: "Glacier Ice", mode: "light", blurb: "Biru es yang ringan dengan tinta safir.", swatch: ["#E9F5FF", "#F9F6EE", "#124D95"] },
  { id: "ivory", name: "Ivory Candle", mode: "light", blurb: "Kertas gading, tinta anggur, dan bayangan lembut.", swatch: ["#FFF6E4", "#F9F6EE", "#781C2E"] },
  { id: "parchment", name: "Parchment Press", mode: "light", blurb: "Kertas cetak hangat dengan tinta biru dan cap hijau.", swatch: ["#F9F6EE", "#FFF6E4", "#00594E"] },
  { id: "sandstone", name: "Sandstone Dune", mode: "light", blurb: "Warna pasir dengan kontrol biru malam.", swatch: ["#D2B48C", "#F9F6EE", "#002147"] },
];

export const HOLIDAY_THEMES: ThemeDef[] = CELEBRATIONS.map((entry) => ({
  id: entry.id,
  name: entry.occasion,
  mode: relLuminance(entry.palette.bg) < .4 ? "dark" : "light",
  blurb: entry.description,
  swatch: [entry.palette.bg, entry.palette.secondary, entry.palette.accent],
  celebration: entry,
}));
export const THEMES: ThemeDef[] = [...STUDIO_THEMES, ...HOLIDAY_THEMES];

export const ACCENTS = [
  { hex: "#C47623", name: "Tembaga" }, { hex: "#D2B48C", name: "Pasir antik" },
  { hex: "#781C2E", name: "Anggur" }, { hex: "#00594E", name: "Hijau laut" },
  { hex: "#124D95", name: "Safir" }, { hex: "#002147", name: "Biru malam" },
  { hex: "#352323", name: "Umber" }, { hex: "#F9F6EE", name: "Krem" },
];

export type Pattern = "aurora" | "dots" | "grid" | "beams" | "plain" | "heritage";
export const PATTERNS: { id: Pattern; name: string }[] = [
  { id: "heritage", name: "Motif SVG" },
  { id: "aurora", name: "Alas studio" },
  { id: "dots", name: "Titik" },
  { id: "grid", name: "Grid" },
  { id: "beams", name: "Diagonal" },
  { id: "plain", name: "Polos" },
];

export type FxLevel = "meriah" | "lembut" | "mati";
/** Used once to make the new animated experience visible to previous Midnight users. */
export const AMBIENT_RELEASE = 1;

export interface Settings {
  theme: string;
  accent: string | null;
  pattern: Pattern;
  sound: boolean;
  particles: boolean;
  motion: boolean;
  decorations: boolean;
  favorites: string[];
  fx: FxLevel;
  ambientRelease: number;
}
export const DEFAULT_SETTINGS: Settings = {
  // A first visit begins on a live New Year stage, not a silent static theme.
  theme: "tahun-baru", accent: null, pattern: "heritage", sound: true,
  particles: true, motion: true, decorations: true, favorites: [], fx: "meriah",
  ambientRelease: AMBIENT_RELEASE,
};
// Keep the old key: existing preferences migrate without losing users' choices.
export const SETTINGS_KEY = "azura.settings.v2";

export function themeById(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? STUDIO_THEMES[0];
}
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function relLuminance(hex: string): number {
  const [r,g,b] = hexToRgb(hex).map((v) => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
  return .2126*r + .7152*g + .0722*b;
}
export function contrastRatio(a: string, b: string): number {
  const x = relLuminance(a), y = relLuminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
export function alphaHex(hex: string, a: number): string {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
export function inkOn(hex: string): string {
  return contrastRatio(hex, "#002147") >= contrastRatio(hex, "#FFF6E4") ? "#002147" : "#FFF6E4";
}

/** Defensive migration of old preferences and validation of all persisted fields. */
export function normalizeSettings(raw: unknown): Settings {
  const p = raw && typeof raw === "object" ? raw as Partial<Settings> : {};
  const favorites = Array.isArray(p.favorites)
    ? [...new Set(p.favorites.filter((id) => typeof id === "string" && THEMES.some((t) => t.id === id)))]
    : [];
  const firstAmbientUpgrade = p.ambientRelease !== AMBIENT_RELEASE;
  const requestedTheme = typeof p.theme === "string" && THEMES.some((t) => t.id === p.theme) ? p.theme : DEFAULT_SETTINGS.theme;
  return {
    // Midnight was the previous silent default, so only that uncustomized default upgrades.
    theme: firstAmbientUpgrade && requestedTheme === "midnight" ? "tahun-baru" : requestedTheme,
    accent: typeof p.accent === "string" && /^#[\da-f]{6}$/i.test(p.accent) ? p.accent : null,
    pattern: PATTERNS.some((t) => t.id === p.pattern) ? p.pattern! : DEFAULT_SETTINGS.pattern,
    sound: typeof p.sound === "boolean" ? p.sound : true,
    particles: typeof p.particles === "boolean" ? p.particles : true,
    motion: typeof p.motion === "boolean" ? p.motion : true,
    decorations: typeof p.decorations === "boolean" ? p.decorations : true,
    favorites,
    fx: p.fx === "lembut" || p.fx === "mati" || p.fx === "meriah" ? p.fx : DEFAULT_SETTINGS.fx,
    ambientRelease: AMBIENT_RELEASE,
  };
}

export function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const theme = themeById(s.theme);
  root.dataset.theme = theme.id;
  root.dataset.celebration = theme.celebration ? theme.id : "none";
  root.dataset.pattern = s.pattern;
  root.dataset.motion = s.motion ? "on" : "off";
  root.dataset.decorations = s.decorations ? "on" : "off";
  root.dataset.fx = s.fx;
  root.style.colorScheme = theme.mode;
  if (s.accent) {
    root.style.setProperty("--accent", s.accent);
    root.style.setProperty("--on-accent", inkOn(s.accent));
    root.style.setProperty("--accent-soft", alphaHex(s.accent, .18));
    root.style.setProperty("--accent-line", alphaHex(s.accent, .55));
    root.style.setProperty("--accent-glow", alphaHex(s.accent, .42));
    root.style.setProperty("--grid-line", s.accent);
  } else {
    for (const name of ["accent", "on-accent", "accent-soft", "accent-line", "accent-glow", "grid-line"]) root.style.removeProperty(`--${name}`);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.swatch[0]);
}
export function loadSettings(): Settings {
  if (typeof window === "undefined") return normalizeSettings(null);
  try { return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null")); }
  catch { return normalizeSettings(null); }
}
export function saveSettings(s: Settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode / quota */ }
}

/** Generated from the actual catalogue; no second hard-coded list can become stale. */
export const THEME_BOOTSTRAP = `(function(){try{
var themes=${JSON.stringify(THEMES.map((t) => ({ id: t.id, mode: t.mode, holiday: Boolean(t.celebration) })))},patterns=${JSON.stringify(PATTERNS.map((p) => p.id))};
var p={};try{p=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"null")||{}}catch(e){}
if(p.ambientRelease!==${AMBIENT_RELEASE}&&p.theme==="midnight")p.theme="tahun-baru";
var d=document.documentElement,fallback=themes.find(function(x){return x.id==="tahun-baru"})||themes[0],t=themes.find(function(x){return x.id===p.theme})||fallback;
d.dataset.theme=t.id;d.dataset.celebration=t.holiday?t.id:"none";d.dataset.pattern=patterns.indexOf(p.pattern)>=0?p.pattern:(t.holiday?"heritage":"aurora");
d.dataset.motion=p.motion===false?"off":"on";d.dataset.decorations=p.decorations===false?"off":"on";d.dataset.fx=(p.fx==="lembut"||p.fx==="mati")?p.fx:"meriah";d.style.colorScheme=t.mode;
if(typeof p.accent==="string"&&/^#[0-9a-fA-F]{6}$/.test(p.accent)){
var n=parseInt(p.accent.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;
function f(c){c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}
var L=.2126*f(r)+.7152*f(g)+.0722*f(b),dark=.2126*f(0)+.7152*f(33)+.0722*f(71),light=.2126*f(255)+.7152*f(246)+.0722*f(228);
function ratio(a,b){return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
d.style.setProperty("--accent",p.accent);d.style.setProperty("--grid-line",p.accent);d.style.setProperty("--on-accent",ratio(L,dark)>=ratio(L,light)?"#002147":"#FFF6E4");
d.style.setProperty("--accent-soft","rgba("+r+","+g+","+b+",.18)");d.style.setProperty("--accent-line","rgba("+r+","+g+","+b+",.55)");d.style.setProperty("--accent-glow","rgba("+r+","+g+","+b+",.42)");}
}catch(e){}})();`;
