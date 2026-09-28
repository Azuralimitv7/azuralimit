/* Theme catalogue + persistence for Azuralimit. */

export interface ThemeDef {
  id: string;
  name: string;
  mode: "dark" | "light";
  blurb: string;
  swatch: [string, string, string];
}

export const THEMES: ThemeDef[] = [
  {
    id: "midnight",
    name: "Azura Midnight",
    mode: "dark",
    blurb: "Deep navy canvas with molten amber accents — the studio default.",
    swatch: ["#002147", "#124D95", "#C47623"],
  },
  {
    id: "lagoon",
    name: "Teal Lagoon",
    mode: "dark",
    blurb: "Submerged teal depths lit by warm sand highlights.",
    swatch: ["#003B33", "#00594E", "#D2B48C"],
  },
  {
    id: "sapphire",
    name: "Royal Sapphire",
    mode: "dark",
    blurb: "Bright royal blue with copper trim, crisp and technical.",
    swatch: ["#0D3A6E", "#124D95", "#C47623"],
  },
  {
    id: "velvet",
    name: "Velvet Wine",
    mode: "dark",
    blurb: "Oxblood velvet warmed with antique gold.",
    swatch: ["#4D1120", "#781C2E", "#D2B48C"],
  },
  {
    id: "espresso",
    name: "Espresso Umber",
    mode: "dark",
    blurb: "Roasted umber, low glare, easy on the eyes at night.",
    swatch: ["#1E1310", "#352323", "#C47623"],
  },
  {
    id: "obsidian",
    name: "Obsidian Ink",
    mode: "dark",
    blurb: "Near-black contrast stage for colour-accurate judging.",
    swatch: ["#06101F", "#002147", "#D2B48C"],
  },
  {
    id: "glacier",
    name: "Glacier Ice",
    mode: "light",
    blurb: "Pale ice blue, sapphire controls, airy daylight workspace.",
    swatch: ["#E9F5FF", "#FFFFFF", "#124D95"],
  },
  {
    id: "ivory",
    name: "Ivory Candle",
    mode: "light",
    blurb: "Warm ivory paper with wine-red ink and soft shadows.",
    swatch: ["#FFF6E4", "#FFFFFF", "#781C2E"],
  },
  {
    id: "parchment",
    name: "Parchment Press",
    mode: "light",
    blurb: "Aged parchment with deep navy text and teal stamps.",
    swatch: ["#F9F6EE", "#FFFFFF", "#00594E"],
  },
  {
    id: "sandstone",
    name: "Sandstone Dune",
    mode: "light",
    blurb: "Sun-baked sand with midnight navy controls.",
    swatch: ["#D2B48C", "#F9F6EE", "#002147"],
  },
];

export const ACCENTS: { hex: string; name: string }[] = [
  { hex: "#C47623", name: "Copper" },
  { hex: "#D2B48C", name: "Antique Sand" },
  { hex: "#781C2E", name: "Wine" },
  { hex: "#00594E", name: "Deep Teal" },
  { hex: "#124D95", name: "Sapphire" },
  { hex: "#002147", name: "Midnight Navy" },
  { hex: "#352323", name: "Umber" },
  { hex: "#F9F6EE", name: "Cream" },
];

export const PATTERNS: { id: Pattern; name: string }[] = [
  { id: "aurora", name: "Aurora" },
  { id: "dots", name: "Dot matrix" },
  { id: "grid", name: "Blueprint grid" },
  { id: "beams", name: "Diagonal beams" },
  { id: "plain", name: "Flat" },
];

export type Pattern = "aurora" | "dots" | "grid" | "beams" | "plain";

export interface Settings {
  theme: string;
  accent: string | null;
  pattern: Pattern;
  sound: boolean;
  particles: boolean;
  motion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "midnight",
  accent: null,
  pattern: "aurora",
  sound: true,
  particles: true,
  motion: true,
};

const KEY = "azura.settings.v2";

export function themeById(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/* ---------- colour maths ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function alphaHex(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** readable ink on top of the given accent */
export function inkOn(hex: string): string {
  return relLuminance(hex) > 0.45 ? "#002147" : "#FFF6E4";
}

/* ---------- persistence + application ---------- */

export function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", themeById(s.theme).id);
  root.setAttribute("data-pattern", s.pattern);
  root.setAttribute("data-motion", s.motion ? "on" : "off");
  if (s.accent) {
    root.style.setProperty("--accent", s.accent);
    root.style.setProperty("--on-accent", inkOn(s.accent));
    root.style.setProperty("--accent-soft", alphaHex(s.accent, 0.18));
    root.style.setProperty("--accent-line", alphaHex(s.accent, 0.55));
    root.style.setProperty("--accent-glow", alphaHex(s.accent, 0.42));
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--on-accent");
    root.style.removeProperty("--accent-soft");
    root.style.removeProperty("--accent-line");
    root.style.removeProperty("--accent-glow");
  }
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: typeof p.theme === "string" && THEMES.some((t) => t.id === p.theme) ? p.theme : DEFAULT_SETTINGS.theme,
      accent: typeof p.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(p.accent) ? p.accent : null,
      pattern: PATTERNS.some((x) => x.id === p.pattern) ? (p.pattern as Pattern) : DEFAULT_SETTINGS.pattern,
      sound: typeof p.sound === "boolean" ? p.sound : DEFAULT_SETTINGS.sound,
      particles: typeof p.particles === "boolean" ? p.particles : DEFAULT_SETTINGS.particles,
      motion: typeof p.motion === "boolean" ? p.motion : DEFAULT_SETTINGS.motion,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Pre-paint bootstrap so the theme never flashes. Runs before React. */
export const THEME_BOOTSTRAP = `(function(){try{
var d=${JSON.stringify(DEFAULT_SETTINGS)},k="azura.settings.v2",r=null;
try{r=JSON.parse(localStorage.getItem(k)||"null")}catch(e){}
if(r&&typeof r==="object"){for(var q in d){if(q in r)d[q]=r[q]}}
var t=document.documentElement;
var ok=["midnight","lagoon","sapphire","velvet","espresso","obsidian","glacier","ivory","parchment","sandstone"];
if(ok.indexOf(d.theme)<0)d.theme="midnight";
t.setAttribute("data-theme",d.theme);
t.setAttribute("data-pattern",["aurora","dots","grid","beams","plain"].indexOf(d.pattern)<0?"aurora":d.pattern);
t.setAttribute("data-motion",d.motion===false?"off":"on");
if(d.accent&&/^#[0-9a-fA-F]{6}$/.test(d.accent)){
var h=d.accent.replace("#","");if(h.length===3){h=h.split("").map(function(c){return c+c}).join("")}
var n=parseInt(h,16),rr=(n>>16)&255,gg=(n>>8)&255,bb=n&255;
var f=function(c){c=c/255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
var L=0.2126*f(rr)+0.7152*f(gg)+0.0722*f(bb);
t.style.setProperty("--accent",d.accent);
t.style.setProperty("--on-accent",L>0.45?"#002147":"#FFF6E4");
t.style.setProperty("--accent-soft","rgba("+rr+", "+gg+", "+bb+", 0.18)");
t.style.setProperty("--accent-line","rgba("+rr+", "+gg+", "+bb+", 0.55)");
t.style.setProperty("--accent-glow","rgba("+rr+", "+gg+", "+bb+", 0.42)");
}
}catch(e){}})();`;
