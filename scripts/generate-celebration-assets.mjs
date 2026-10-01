/* Azuralimit / Almanak Nusantara
 * Original vector drawings, composed for this project. No fetched graphics,
 * external fonts, raster images, scripts, remote links or embedded animation.
 * Motion is added by the app so every SVG also has a fully static fallback.
 * Run: node scripts/generate-celebration-assets.mjs
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const entries = JSON.parse(await readFile(path.join(root, "src/lib/celebrations.json"), "utf8"));
const P = { navy: "#002147", sand: "#D2B48C", paper: "#F9F6EE", wine: "#781C2E", teal: "#00594E", ivory: "#FFF6E4", blue: "#124D95", ice: "#E9F5FF", umber: "#352323", copper: "#C47623" };
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const group = (x, y, body, scale = 1, rotation = 0) => `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${body}</g>`;
const circle = (x, y, r, fill, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, color = P.sand, width = 2, extra = "") => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
function star(x, y, r, color, count = 5) {
  const points = Array.from({ length: count * 2 }, (_, i) => {
    const angle = i * Math.PI / count - Math.PI / 2;
    const size = i % 2 ? r * .44 : r;
    return `${(x + Math.cos(angle) * size).toFixed(2)},${(y + Math.sin(angle) * size).toFixed(2)}`;
  }).join(" ");
  return `<polygon points="${points}" fill="${color}"/>`;
}
function rays(x, y, r, color, n = 12) {
  return Array.from({ length: n }, (_, i) => {
    const a = i * Math.PI * 2 / n;
    return line(x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7, x + Math.cos(a) * r, y + Math.sin(a) * r, color, 2);
  }).join("");
}
function crescent(color) {
  return `<path d="M28-64C-38-43-40 43 28 64C-67 67-91-48-18-70C-4-74 13-70 28-64Z" fill="${color}"/>`;
}
function sprig(color = P.teal) {
  return `<path d="M0 62Q-8 4 26-64" stroke="${color}" stroke-width="3" fill="none"/>` + [-38, -12, 14, 40].map((y, i) => `<path d="M${5 + i * -2} ${y + 18}Q-55 ${y - 12}-19 ${y - 28}Q7 ${y - 18}${5 + i * -2} ${y + 18}Z" fill="${color}"/><path d="M${7 + i * -2} ${y + 5}Q56 ${y - 23}49 ${y - 43}Q21 ${y - 42}${7 + i * -2} ${y + 5}Z" fill="${color}"/>`).join("");
}
function flower(color = P.ivory, middle = P.copper) {
  return Array.from({ length: 6 }, (_, i) => `<ellipse cx="0" cy="-24" rx="14" ry="27" fill="${color}" transform="rotate(${i * 60})"/>`).join("") + circle(0, 0, 11, middle);
}
function cloud(color) {
  return `<path d="M-70 18C-87-12-57-36-34-25C-25-62 24-66 43-27C68-33 93-11 76 18Z" fill="${color}"/>`;
}
function ketupat() {
  let weave = rect(-56, -56, 112, 112, P.teal);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) weave += rect(-56 + col * 28, -56 + row * 28, 27, 27, (col + row) % 2 ? P.sand : P.teal, `stroke="${P.ivory}" stroke-opacity=".2"`);
  return `<path d="M0-120V-84M-12 80Q-35 122-15 161L10 132Q-2 107 10 80M21 78Q43 104 37 137L59 118Q59 92 37 75" fill="${P.teal}" stroke="${P.teal}" stroke-width="3"/>` + group(0, 0, weave, 1, 45);
}
function lantern() {
  return line(0, -108, 0, -68, P.sand, 3) + `<ellipse cy="-2" rx="53" ry="65" fill="${P.wine}" stroke="${P.sand}" stroke-width="3"/><ellipse cy="-2" rx="32" ry="65" fill="none" stroke="${P.copper}" stroke-width="3"/><ellipse cy="-2" rx="12" ry="65" fill="none" stroke="${P.sand}" stroke-width="2"/>` + rect(-31, -69, 62, 11, P.sand) + rect(-30, 55, 60, 10, P.sand) + line(0, 65, 0, 103, P.sand, 4) + `<path d="M-11 92H11L15 119H-15Z" fill="${P.copper}"/>`;
}
function pelita() {
  return line(0, -109, 0, -66, P.sand, 2) + `<path d="M-36-38L0-72 36-38 47 44 0 69-47 44Z" fill="${P.teal}" stroke="${P.sand}" stroke-width="3"/><path d="M-22-26H22L28 37 0 54-28 37Z" fill="${P.sand}"/><path d="M-8-21V40M8-21V40" stroke="${P.teal}" stroke-width="4"/>` + rect(-42, -43, 84, 10, P.copper) + rect(-43, 41, 86, 9, P.copper);
}
function flag() {
  return line(-65, -102, -65, 125, P.sand, 5) + circle(-65, -105, 5, P.copper) + `<path d="M-61-92C-5-123 28-61 80-92V-45C28-15-5-77-61-45Z" fill="${P.wine}"/><path d="M-61-45C-5-77 28-15 80-45V3C28 33-5-29-61 3Z" fill="${P.ivory}" stroke="${P.sand}" stroke-width="1.2"/>`;
}
function lotus() {
  return `<path d="M0 38C-47 5-48-54 0-80C47-54 47 5 0 38Z" fill="${P.ivory}" stroke="${P.copper}" stroke-width="2"/>` + `<path d="M0 38C-63 38-92-10-72-57C-10-58 9-14 0 38Z" fill="${P.sand}"/><path d="M0 38C63 38 92-10 72-57C10-58-9-14 0 38Z" fill="${P.sand}"/><path d="M0 42C-72 77-111 14-96-20C-50-26-7 0 0 42ZM0 42C72 77 111 14 96-20C50-26 7 0 0 42Z" fill="${P.copper}"/>` + `<path d="M-112 68Q0 91 112 68M-76 84Q0 100 76 84" stroke="${P.sand}" stroke-width="2" fill="none"/>`;
}
function book() {
  return `<path d="M0-48Q-54-88-111-54V63Q-53 27 0 61Q53 27 111 63V-54Q54-88 0-48Z" fill="${P.ivory}" stroke="${P.navy}" stroke-width="4"/><path d="M0-48V61M-89-34Q-51-47-22-26M-89-13Q-51-26-22-5M-89 8Q-51-5-22 16M22-26Q51-47 89-34M22-5Q51-26 89-13M22 16Q51-5 89 8" fill="none" stroke="${P.sand}" stroke-width="3"/><path d="M-113 73Q-48 47 0 72Q48 47 113 73" fill="none" stroke="${P.teal}" stroke-width="5"/>`;
}
function lily() {
  return `<path d="M0 99V-18" stroke="${P.teal}" stroke-width="5"/><path d="M0 71C-52 61-80 4-30 19Q-6 25 0 71M0 92C51 67 85 22 44 33Q9 46 0 92" fill="${P.teal}"/>` + `<path d="M0-10C-20-86-87-63-60-29Q-37-2 0-10C-14-102 39-105 42-52Q42-27 0-10C55-64 107-37 72-9Q44 15 0-10Z" fill="${P.ivory}" stroke="${P.sand}" stroke-width="2"/><path d="M-4-9L-16-44M0-7L21-41M0-5L44-20" stroke="${P.copper}" stroke-width="3"/>`;
}
function dove(color = P.ivory) {
  return `<path d="M-72 31Q-112-40-45-71Q-18-17 7-7Q29-47 77-28Q54-15 35-4Q55 13 32 29Q-10 67-72 31Z" fill="${color}" stroke="${P.sand}" stroke-width="2"/><path d="M-68 31L-109 62-74 67-42 39" fill="${color}"/>` + circle(46, -17, 3, P.navy) + `<path d="M75-17L100-11 74-8" fill="${P.copper}"/>`;
}
function gear(color = P.copper) {
  let teeth = "";
  for (let i = 0; i < 12; i++) teeth += `<rect x="-12" y="-77" width="24" height="29" fill="${color}" transform="rotate(${i * 30})"/>`;
  return teeth + circle(0, 0, 66, color) + circle(0, 0, 33, P.ivory) + circle(0, 0, 20, P.umber);
}
function rosette(color = P.teal) {
  return Array.from({ length: 8 }, (_, i) => `<path d="M0 0Q-42-52 0-78Q42-52 0 0Z" fill="none" stroke="${color}" stroke-width="2.5" transform="rotate(${i * 45})"/>`).join("") + star(0, 0, 29, P.sand, 8);
}
function kite() {
  return `<path d="M0-79L55-13 0 72-55-13Z" fill="${P.ivory}" stroke="${P.navy}" stroke-width="3"/><path d="M0-79L55-13H0ZM0-13V72L-55-13Z" fill="${P.wine}"/><path d="M0 72Q-55 114 0 131Q40 152 0 180" fill="none" stroke="${P.navy}" stroke-width="2.5"/><path d="M-16 115L-41 106-38 129ZM1 149L25 140 22 163Z" fill="${P.copper}"/>`;
}
function pine(color = P.teal) {
  return rect(-7, 64, 14, 34, P.sand) + `<path d="M0-104L42-45H26L65 11H43L82 70H-82L-43 11H-65L-26-45H-42Z" fill="${color}"/>`;
}
function medal() {
  return `<path d="M-48-100H-5L20-16H-12ZM8-100H50L18-16H-11Z" fill="${P.wine}"/>` + circle(0, 18, 57, P.sand) + circle(0, 18, 46, "none", `stroke="${P.copper}" stroke-width="3"`) + star(0, 18, 30, P.copper);
}
function kawung(color = P.sand) {
  return [0, 90, 180, 270].map((r) => `<ellipse cx="0" cy="-27" rx="16" ry="28" fill="none" stroke="${color}" stroke-width="2.5" transform="rotate(${r})"/>`).join("") + circle(0, 0, 4, color);
}
function flame() {
  return `<path d="M0-57C-4-23 38-14 34 15C33 43-33 46-37 15C-42-8-8-9 0-57Z" fill="${P.copper}"/><path d="M0-17C-6 7 19 13 14 28C5 40-18 34-16 21Q-15 8 0-17Z" fill="${P.ivory}"/>`;
}
function sun(color = P.copper) {
  return circle(0, 0, 54, color) + rays(0, 0, 85, color, 16);
}
function leafGlobe() {
  return circle(0, 0, 68, P.blue) + `<ellipse rx="27" ry="68" fill="none" stroke="${P.ice}" stroke-width="2"/><path d="M-63-21H63M-64 24H64" stroke="${P.ice}" stroke-width="2"/><path d="M-42-46L-13-31-22-7-44-12-49 19-67 2M32-45L59-27 50-9 23-8 13 19 20 52-1 46-10 16 8-17Z" fill="${P.teal}" stroke="${P.sand}" stroke-width="1.2"/>`;
}
function compass() {
  return circle(0, 0, 64, P.ivory, `stroke="${P.umber}" stroke-width="3"`) + circle(0, 0, 54, "none", `stroke="${P.sand}" stroke-width="2"`) + `<path d="M0-48L14 0 0 48-14 0Z" fill="${P.wine}"/><path d="M-48 0L0-14 48 0 0 14Z" fill="${P.teal}"/>` + circle(0, 0, 7, P.copper);
}
function postmark(ink) {
  return circle(666, 72, 33, "none", `stroke="${ink}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".32"`) + line(612, 87, 716, 87, ink, 1, 'opacity=".2"') + line(617, 95, 721, 95, ink, 1, 'opacity=".2"');
}
function hills(color, secondary) {
  return `<path d="M60 331L195 235 290 315 390 203 580 337 699 299V368H60Z" fill="${color}" opacity=".3"/><path d="M36 365Q231 286 409 346T724 344V394H36Z" fill="${secondary}" opacity=".25"/>`;
}
function arch(color) {
  return `<path d="M-98 114V-26Q-92-83 0-124Q92-83 98-26V114" fill="none" stroke="${color}" stroke-width="4"/><path d="M-82 114V-24Q-73-73 0-106Q73-73 82-24V114" fill="none" stroke="${color}" stroke-width="1.5" opacity=".5"/>`;
}
function dome(color, ink) {
  return `<path d="M-98 34Q-102-8-60-28Q-21-46 0-92Q21-46 60-28Q102-8 98 34Z" fill="${color}" stroke="${ink}" stroke-width="2"/>` + rect(-82, 37, 164, 87, color, `stroke="${ink}" stroke-width="2"`) + `<path d="M-19 124V78Q0 49 19 78V124" fill="${ink}"/>` + line(0, -92, 0, -118, ink, 2);
}
function meru() {
  const roof = (y, w) => `<path d="M${-w} ${y}Q-28 ${y - 9}0 ${y - 35}Q28 ${y - 9}${w} ${y}Z" fill="${P.navy}" stroke="${P.sand}" stroke-width="1.5"/>`;
  return rect(-20, -45, 40, 172, P.navy) + roof(-44, 38) + roof(-9, 48) + roof(30, 58) + roof(73, 69) + rect(-33, 98, 66, 44, P.navy) + line(-49, 144, 49, 144, P.sand, 3);
}
function ribbon(color) {
  return `<path d="M-95 0Q-10-50 95 0L80 23Q-3-13-80 24Z" fill="${color}"/>`;
}
function motifsFor(id) {
  switch (id) {
    case "tahun-baru": return rays(0, 0, 69, P.sand) + star(0, 0, 28, P.copper, 8);
    case "isra-mikraj": case "hijriah": return crescent(P.sand) + star(34, -8, 15, P.ivory, 6);
    case "imlek": return lantern();
    case "ramadan": return pelita();
    case "nyepi": return crescent(P.sand);
    case "idul-fitri": return ketupat();
    case "jumat-agung": return sprig(P.teal);
    case "paskah": return lily();
    case "kartini": return flower();
    case "buruh": return gear();
    case "pendidikan": return book();
    case "kenaikan": return dove();
    case "kebangkitan": case "lingkungan": return sprig(P.teal);
    case "idul-adha": return rosette(P.sand);
    case "waisak": return lotus();
    case "pancasila": case "kesaktian-pancasila": return star(0, 0, 71, P.sand);
    case "anak": return kite();
    case "pramuka": return compass();
    case "kemerdekaan": case "sumpah-pemuda": return flag();
    case "maulid": return rosette(P.teal);
    case "olahraga": return medal();
    case "batik": return kawung();
    case "pahlawan": return flame();
    case "guru": return flower(P.ivory, P.copper);
    case "ibu": return flower(P.wine, P.copper);
    case "natal": return pine();
    default: throw new Error(`Missing illustration for ${id}`);
  }
}
function illustration(e) {
  const { id, palette: p } = e;
  const backdrop = circle(380, 206, 151, p.secondary, 'opacity=".15"');
  const smallStars = [[163, 121, 10], [584, 92, 8], [548, 302, 6]].map(([x, y, r]) => star(x, y, r, p.accent, 4)).join("");
  let drawing = "";
  switch (id) {
    case "tahun-baru":
      drawing = group(304, 150, rays(0, 0, 93, P.sand, 18) + star(0, 0, 28, P.copper, 8)) + group(491, 218, rays(0, 0, 76, P.ivory, 12)) + group(176, 267, rays(0, 0, 37, P.copper, 8)) + `<path d="M296 334Q310 272 304 151M500 351Q469 293 491 218" stroke="${P.sand}" fill="none" stroke-width="2" stroke-dasharray="4 7"/>`;
      break;
    case "isra-mikraj":
      drawing = group(389, 228, arch(P.sand)) + group(390, 173, crescent(P.ivory), .6) + star(426, 152, 13, P.sand, 6) + group(244, 226, pelita(), .42) + group(550, 161, pelita(), .32);
      break;
    case "imlek":
      drawing = group(320, 186, lantern(), 1.24) + group(502, 153, lantern(), .72) + `<path d="M162 318Q178 174 278 92M180 215Q118 162 127 114" fill="none" stroke="${P.sand}" stroke-width="4"/>` + group(183, 199, flower(P.ivory), .29) + group(234, 131, flower(P.sand, P.wine), .3) + group(130, 127, flower(), .24);
      break;
    case "ramadan":
      drawing = group(267, 169, crescent(P.sand), 1.35) + group(428, 214, pelita(), 1.1) + group(563, 158, pelita(), .57) + group(409, 229, arch(P.sand), 1.12);
      break;
    case "nyepi":
      drawing = hills(P.blue, P.teal) + circle(481, 135, 34, P.ivory) + group(385, 229, meru(), .82) + group(238, 266, meru(), .42) + line(142, 364, 633, 364, P.sand, 1);
      break;
    case "idul-fitri":
      drawing = group(363, 202, ketupat(), 1.32, -10) + group(528, 198, ketupat(), .76, 12) + `<path d="M185 313Q96 99 274 64Q189 143 198 288M179 299Q91 233 115 133Q171 181 194 261" fill="${P.teal}"/><path d="M192 298Q157 166 245 94" stroke="${P.sand}" stroke-width="2" fill="none"/>`;
      break;
    case "jumat-agung":
      drawing = group(379, 230, arch(P.sand), 1.04) + rect(364, 101, 26, 199, P.wine) + rect(315, 144, 123, 25, P.wine) + group(251, 259, sprig(P.teal), .58, -28) + group(519, 277, sprig(P.teal), .48, 31);
      break;
    case "paskah":
      drawing = group(468, 149, sun(P.sand), .8) + group(318, 221, lily(), 1.08, -12) + group(452, 251, lily(), .83, 14) + `<path d="M163 337Q380 308 605 337" stroke="${P.teal}" stroke-width="3" fill="none"/>`;
      break;
    case "kartini":
      drawing = group(355, 224, rect(-108, -112, 216, 230, P.ivory, `stroke="${P.sand}" stroke-width="3"`) + [0, 23, 46, 69].map((v) => line(-79, v - 24, 61, v - 24, P.sand, 3)).join("") + line(-79, -72, -13, -72, P.wine, 5), 1, -8) + `<path d="M430 282L477 103 505 81 511 117 448 289 428 312Z" fill="${P.wine}"/><path d="M437 291L493 114" stroke="${P.sand}" stroke-width="2"/>` + group(239, 280, flower(), .73) + group(539, 247, sprig(P.teal), .45, 26);
      break;
    case "buruh":
      drawing = group(376, 211, gear(), 1.5) + `<path d="M230 287L281 128 304 131 309 170 258 298Z" fill="${P.sand}"/><path d="M500 118L527 122 522 275 490 290 489 264Z" fill="${P.ivory}"/>` + group(542, 316, gear(P.teal), .36) + rays(376, 211, 156, P.sand, 16);
      break;
    case "pendidikan":
      drawing = group(354, 248, book(), 1.1) + `<path d="M489 309L533 113 553 119 509 314 493 332Z" fill="${P.copper}"/><path d="M357 195V125Q335 124 323 99Q365 89 367 126Q376 106 404 111Q406 148 357 148" fill="${P.teal}"/>` + group(216, 119, star(0, 0, 24, P.blue, 4));
      break;
    case "kenaikan":
      drawing = rays(403, 155, 120, P.sand, 20) + group(400, 168, dove(), 1.28) + group(255, 295, cloud(P.ivory), 1.12) + group(498, 301, cloud(P.ivory), 1.3) + group(174, 189, cloud(P.sand), .49);
      break;
    case "kebangkitan":
      drawing = group(374, 150, sun(P.copper), 1.1) + group(371, 228, sprig(P.teal), 1.3) + group(400, 334, ribbon(P.wine), 1.8) + line(169, 361, 623, 361, P.navy, 2);
      break;
    case "idul-adha":
      drawing = group(381, 215, dome(P.teal, P.sand), 1.0) + group(224, 267, sprig(P.sand), .65, -24) + group(552, 269, sprig(P.sand), .61, 29) + group(380, 75, crescent(P.ivory), .22) + circle(380, 203, 161, "none", `stroke="${P.sand}" stroke-dasharray="2 9" opacity=".5"`);
      break;
    case "waisak":
      drawing = `<path d="M294 226Q300 126 384 91Q468 126 474 226Z" fill="${P.copper}" opacity=".35"/><path d="M384 63V112M305 241H463" stroke="${P.sand}" stroke-width="3"/>` + group(385, 254, lotus(), 1.28) + group(199, 124, pelita(), .25) + group(566, 105, pelita(), .31);
      break;
    case "pancasila":
      drawing = Array.from({ length: 5 }, (_, i) => group(380, 202, `<path d="M0-139L54-57 0-31-54-57Z" fill="${i % 2 ? P.copper : P.ivory}" opacity=".32"/>`, 1, i * 72)).join("") + star(380, 202, 105, P.sand) + group(380, 341, ribbon(P.ivory), 1.7);
      break;
    case "lingkungan":
      drawing = group(380, 199, leafGlobe(), 1.44) + group(229, 245, sprig(P.teal), .91, -34) + group(549, 257, sprig(P.teal), .85, 39) + `<path d="M220 346Q295 320 380 346T553 346" stroke="${P.blue}" stroke-width="3" fill="none"/>`;
      break;
    case "hijriah":
      drawing = group(379, 188, crescent(P.sand), 1.78, -10) + star(469, 166, 31, P.ivory, 8) + group(381, 232, arch(P.blue), 1.48) + group(213, 265, rosette(P.sand), .31);
      break;
    case "anak":
      drawing = group(357, 176, kite(), 1.1, 13) + group(513, 177, kite(), .58, -14) + group(186, 193, cloud(P.ivory), .75) + group(540, 95, cloud(P.ivory), .62) + star(201, 313, 17, P.copper, 4);
      break;
    case "pramuka":
      drawing = hills(P.teal, P.umber) + group(575, 224, pine(), .67) + group(205, 204, pine(), .79) + `<path d="M241 331L379 135 512 331Z" fill="${P.ivory}" stroke="${P.umber}" stroke-width="3"/><path d="M379 135L342 331H431Z" fill="${P.umber}"/>` + group(565, 117, compass(), .52);
      break;
    case "kemerdekaan":
      drawing = group(364, 219, flag(), 1.46) + `<path d="M166 127Q382 242 618 124" stroke="${P.navy}" stroke-width="2" fill="none"/>` + [218, 278, 338, 398, 458, 518].map((x, i) => `<path d="M${x} ${155 + (i < 3 ? i * 8 : (5 - i) * 8)}l16 38 18-33Z" fill="${i % 2 ? P.ivory : P.wine}" stroke="${P.sand}"/>`).join("") + group(577, 289, flag(), .48, 9);
      break;
    case "maulid":
      drawing = group(380, 221, arch(P.teal), 1.15) + group(380, 184, rosette(P.teal), 1.14) + group(236, 278, sprig(P.teal), .54, -32) + group(534, 282, sprig(P.teal), .54, 32);
      break;
    case "olahraga":
      drawing = [0, 18, 36, 54].map((offset) => `<rect x="${158 + offset}" y="${87 + offset}" width="${444 - 2 * offset}" height="${254 - 2 * offset}" rx="${118 - offset}" fill="none" stroke="${P.sand}" stroke-width="2" opacity=".4"/>`).join("") + group(381, 200, medal(), 1.3) + group(217, 262, sprig(P.ivory), .43, -27);
      break;
    case "kesaktian-pancasila":
      drawing = [-2, -1, 0, 1, 2].map((i) => rect(367 + i * 40, 221 - (2 - Math.abs(i)) * 14, 27, 106 + (2 - Math.abs(i)) * 14, i % 2 ? P.wine : P.sand)).join("") + star(380, 132, 73, P.sand) + line(234, 342, 526, 342, P.ivory, 3) + group(206, 236, sprig(P.sand), .61, -25);
      break;
    case "batik":
      drawing = `<path d="M191 110Q378 67 564 119V325Q378 279 191 335Z" fill="${P.copper}" opacity=".2"/>` + [0, 1, 2, 3].map((col) => [0, 1, 2].map((row) => group(245 + col * 87, 142 + row * 78, kawung(P.sand), .64)).join("")).join("") + `<path d="M456 289L589 90" stroke="${P.ivory}" stroke-width="13" stroke-linecap="round"/><path d="M447 304Q430 285 438 268Q459 265 471 281Z" fill="${P.copper}" stroke="${P.sand}" stroke-width="2"/><path d="M441 294L422 323" stroke="${P.copper}" stroke-width="4"/>`;
      break;
    case "sumpah-pemuda":
      drawing = group(379, 264, book(), 1.26) + group(403, 165, ribbon(P.wine), 1.66, -12) + group(403, 179, ribbon(P.ivory), 1.66, -12) + group(548, 185, flag(), .64, 8) + star(225, 141, 34, P.copper, 5);
      break;
    case "pahlawan":
      drawing = `<path d="M347 301L362 108H397L414 301Z" fill="${P.sand}"/><path d="M331 302H430V319H331ZM308 319H451V337H308Z" fill="${P.ivory}"/>` + group(380, 85, flame(), .45) + group(229, 241, sprig(P.sand), .8, -26) + group(539, 248, sprig(P.sand), .8, 28);
      break;
    case "guru":
      drawing = rect(231, 83, 300, 179, P.sand) + rect(242, 94, 278, 157, P.teal) + `<path d="M280 131H424M280 150H466M280 169H382M262 267L236 332M500 267L528 332" stroke="${P.ivory}" stroke-width="3"/>` + group(346, 298, book(), .68) + group(570, 279, flower(P.ivory), .75) + line(570, 292, 565, 343, P.teal, 5);
      break;
    case "ibu":
      drawing = `<path d="M365 256V158M365 207Q310 172 304 207Q304 238 365 242M365 182Q409 131 428 161Q438 187 365 209" fill="${P.teal}" stroke="${P.teal}" stroke-width="3"/>` + group(365, 126, flower(P.wine), .95) + `<path d="M191 233L254 240 303 277 365 283 365 310 287 310 220 273Z" fill="${P.sand}" stroke="${P.umber}" stroke-width="2"/><path d="M571 233L508 240 459 277 383 283 383 310 475 310 542 273Z" fill="${P.sand}" stroke="${P.umber}" stroke-width="2"/>` + group(385, 346, ribbon(P.wine), 1.06);
      break;
    case "natal":
      drawing = group(384, 222, pine(P.teal), 1.18) + `<path d="M384 102L430 168H413L461 234H432L481 307H287L336 234H307L355 168H338Z" fill="none" stroke="${P.sand}" stroke-width="3"/>` + star(384, 79, 28, P.sand, 5) + [[366, 156], [400, 200], [345, 244], [421, 262], [376, 290]].map(([x,y], i) => circle(x, y, 7, i % 2 ? P.wine : P.ivory)).join("") + rect(199, 287, 76, 55, P.wine) + rect(232, 280, 10, 63, P.sand) + rect(494, 300, 56, 44, P.copper) + rect(517, 292, 9, 52, P.ivory);
      break;
    default: throw new Error(`Missing poster: ${id}`);
  }
  return backdrop + smallStars + drawing + postmark(p.ink);
}
function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title>${body}</svg>\n`;
}
function rgb(hex) { return hex.slice(1).match(/../g).map((v) => parseInt(v, 16)); }
function mix(a, b, t) { return "#" + rgb(a).map((v, i) => Math.round(v * (1 - t) + rgb(b)[i] * t).toString(16).padStart(2, "0")).join(""); }
function alpha(hex, opacity) { return `rgba(${rgb(hex).join(",")},${opacity})`; }
function luminance(hex) { const [r,g,b] = rgb(hex).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126*r + .7152*g + .0722*b; }
function contrast(a,b) { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function on(color) { return contrast(color, P.navy) >= contrast(color, P.ivory) ? P.navy : P.ivory; }
function tokens(e) {
  const p = e.palette;
  const dark = luminance(p.bg) < .4;
  const surface = mix(p.surface, p.ink, .035);
  const pairs = {
    bg: p.bg, 'bg-a': alpha(p.secondary, .16), 'bg-b': alpha(p.accent, .11), 'bg-c': alpha(p.secondary, .12), 'bg-dot': alpha(p.ink, .07),
    surface, 'surface-2': mix(p.bg, p.ink, .025), 'surface-3': mix(p.surface, p.ink, .065),
    line: alpha(p.ink, .17), 'line-strong': alpha(p.ink, .35), ink: p.ink, 'ink-soft': mix(p.ink, surface, .17), 'ink-faint': mix(p.ink, surface, .28),
    accent: p.accent, 'on-accent': on(p.accent), 'accent-soft': alpha(p.accent, .14), 'accent-line': alpha(p.accent, .65), 'accent-glow': alpha(p.accent, .3),
    good: dark ? P.ice : P.teal, 'good-bg': alpha(dark ? P.ivory : P.teal, .09), 'good-line': alpha(dark ? P.ivory : P.teal, .38),
    bad: dark ? P.ivory : P.wine, 'bad-bg': alpha(dark ? P.copper : P.wine, .16), 'bad-line': alpha(dark ? P.sand : P.wine, .5),
    overlay: alpha(P.navy, .78), checker: alpha(p.ink, .075), 'grid-line': p.accent,
    shadow: alpha(P.navy, dark ? .8 : .12), 'shadow-hard': alpha(P.navy, dark ? .7 : .16), menu: mix(p.bg, p.ink, .03),
    'holiday-pattern': `url("/assets/celebrations/${e.id}/pattern.svg")`, 'holiday-secondary': p.secondary,
  };
  return `:root[data-theme="${e.id}"] {\n${Object.entries(pairs).map(([k,v]) => `  --${k}: ${v};`).join("\n")}\n}\n`;
}

let bytes = 0;
for (const e of entries) {
  const dir = path.join(root, "public/assets/celebrations", e.id);
  await mkdir(dir, { recursive: true });
  const dotTexture = `<defs><pattern id="ink-grain" width="21" height="21" patternUnits="userSpaceOnUse">${circle(3, 5, .7, e.palette.ink)}${circle(14, 17, .55, e.palette.ink)}</pattern></defs>${rect(0,0,760,420,e.palette.bg)}${rect(0,0,760,420,"url(#ink-grain)",'opacity=".1"')}`;
  const marks = `<path d="M28 53V28H53M707 28H732V53M28 367V392H53M707 392H732V367" stroke="${e.palette.ink}" stroke-width="1" opacity=".3"/>`;
  const files = {
    "poster.svg": svg(760,420, dotTexture + marks + illustration(e), `${e.occasion} — ${e.artTitle}. Ilustrasi orisinal Azuralimit.`),
    "motif.svg": svg(240,300, group(120,136,motifsFor(e.id), .88), `Ornamen ${e.occasion} — ${e.motif}`),
    "pattern.svg": svg(120,120, group(60,60, e.id === "batik" ? kawung(e.palette.ink) : e.category === "keagamaan" ? rosette(e.palette.ink) : star(0,0,32,e.palette.ink,4), .43) .replace('<g ', '<g opacity=".065" ') + circle(0,0,2,e.palette.ink,'opacity=".08"') + circle(120,120,2,e.palette.ink,'opacity=".08"'), `Pola latar ${e.occasion}`),
  };
  for (const [filename, content] of Object.entries(files)) { await writeFile(path.join(dir,filename),content); bytes += Buffer.byteLength(content); }
}
await writeFile(path.join(root,"src/app/celebrations.css"), `/* Generated locally by scripts/generate-celebration-assets.mjs. */\n${entries.map(tokens).join("\n")}\n[data-pattern="heritage"] body {\n  background-image: var(--holiday-pattern, url("/assets/celebrations/batik/pattern.svg"));\n  background-size: 120px 120px;\n}\n`);
await writeFile(path.join(root,"public/assets/celebrations/manifest.json"), JSON.stringify({ version: 1, originalArtwork: true, count: entries.length, assets: entries.map(({id,occasion,motif}) => ({ id, occasion, motif, poster: `${id}/poster.svg`, ornament: `${id}/motif.svg`, pattern: `${id}/pattern.svg` })) }, null, 2) + "\n");
console.log(`Rendered ${entries.length * 3} original SVGs (${Math.round(bytes/1024)} KB total), theme tokens and asset manifest.`);
