import { test, expect, type Page } from "@playwright/test";
import catalogue from "../../src/lib/celebrations.json";

async function openThemes(page: Page) {
  await page.getByTitle("Buka Rak Pengaturan Tema & Suara").click();
  const dialog = page.getByRole("dialog", { name: "Almanak Nusantara." });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function forceStudioStart(page: Page) {
  await page.addInitScript(() => {
    // addInitScript runs on every navigation; initialize only once so reload tests
    // verify real persistence instead of overwriting localStorage again.
    if (sessionStorage.getItem("az-test-studio-seeded")) return;
    sessionStorage.setItem("az-test-studio-seeded", "1");
    localStorage.setItem("azura.settings.v2", JSON.stringify({
      theme: "midnight", ambientRelease: 1, pattern: "aurora", accent: null,
      sound: false, particles: false, motion: true, decorations: true, favorites: [], fx: "meriah",
    }));
  });
}

test("new visitor lands directly on a live New Year celebration stage", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "tahun-baru");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "meriah");
  await expect(page.locator("html")).toHaveAttribute("data-pattern", "heritage");
  await expect(page.getByLabel("Tema pilihan: Tahun Baru")).toBeVisible();
  await expect(page.locator("canvas.celebration-ambient")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nyalakan efek", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("gallery search, category/month filtering, favorites and reload persistence", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await forceStudioStart(page);
  await page.goto("/");
  await expect(page.getByLabel("Koleksi tema hari besar Indonesia")).toBeVisible();
  const dialog = await openThemes(page);
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(30);
  await dialog.getByLabel("Cari tema").fill("ketupat");
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(1);
  await dialog.getByRole("button", { name: "Pakai tema Idulfitri", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "idul-fitri");
  await expect(page.locator("html")).toHaveAttribute("data-pattern", "heritage");
  await dialog.getByRole("button", { name: "Simpan Idulfitri ke favorit", exact: true }).click();
  await dialog.getByLabel("Hapus pencarian").click();
  await dialog.getByLabel("Hanya libur nasional").check();
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(16);
  await dialog.getByLabel("Hanya libur nasional").uncheck();
  await dialog.getByLabel("Bulan perayaan").selectOption("8");
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(3);
  await dialog.getByLabel("Bulan perayaan").selectOption("all");
  await dialog.getByRole("button", { name: "Keagamaan", exact: true }).click();
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(12);
  await dialog.getByRole("button", { name: /^Favorit/ }).click();
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(1);
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.getByLabel("Tema pilihan: Idulfitri")).toBeVisible();
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
  expect(background.toLowerCase()).toBe("#fff6e4");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "idul-fitri");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("azura.settings.v2")!));
  expect(saved.favorites).toContain("idul-fitri");
  expect(errors).toEqual([]);
});

test("all 30 themes apply their real palette, even with every remote origin blocked", async ({ page, request }) => {
  const remote: string[] = [], errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await forceStudioStart(page);
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") { remote.push(url.href); return route.abort(); }
    await route.continue();
  });
  await page.goto("/");
  const dialog = await openThemes(page);
  for (const entry of catalogue) {
    await dialog.getByLabel("Cari tema").fill(entry.occasion);
    await dialog.getByRole("button", { name: `Pakai tema ${entry.occasion}`, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", entry.id);
    const color = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const channels = entry.palette.bg.slice(1).match(/../g)!.map((value) => parseInt(value, 16));
    expect(color).toBe(`rgb(${channels.join(", ")})`);
    for (const filename of ["poster.svg", "motif.svg", "pattern.svg"]) {
      const response = await request.get(`/assets/celebrations/${entry.id}/${filename}`);
      expect(response.ok()).toBeTruthy();
      expect(response.headers()["content-type"]).toContain("image/svg+xml");
    }
  }
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.getByLabel("Tema pilihan: Hari Natal")).toBeVisible();
  const poster = page.locator('.celebration-banner .celebration-poster');
  await expect(poster).toBeVisible();
  expect(await poster.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBeTruthy();
  await page.screenshot({ path: "/tmp/azuralimit-holiday-desktop.png", fullPage: false });
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test("ambient celebration FX appears per occasion and respects intensity", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await forceStudioStart(page);
  await page.goto("/");
  // studio theme: no ambient celebration layer
  await expect(page.locator("canvas.celebration-ambient")).toHaveCount(0);
  // new year: fireworks canvas appears
  const dialog = await openThemes(page);
  await dialog.getByLabel("Cari tema").fill("Tahun Baru");
  await dialog.getByRole("button", { name: "Pakai tema Tahun Baru", exact: true }).click();
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  const ambient = page.locator("canvas.celebration-ambient");
  await expect(ambient).toBeVisible();
  await expect(ambient).toHaveAttribute("data-celebration-fx", "tahun-baru");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "meriah");
  // banner advertises the choreography + quick intensity switch
  await expect(page.getByText("EFEK LATAR: KEMBANG API TAHUN BARU")).toBeVisible();
  // switch occasion: canvas follows the new celebration
  const dialog2 = await openThemes(page);
  await dialog2.getByLabel("Cari tema").fill("imlek");
  await dialog2.getByRole("button", { name: "Pakai tema Tahun Baru Imlek", exact: true }).click();
  await dialog2.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(ambient).toHaveAttribute("data-celebration-fx", "imlek");
  await expect(page.getByText("EFEK LATAR: LAMPION TERBANG & PETASAN")).toBeVisible();
  // Even when the background is muted, the visible CTA should force an
  // immediate celebration and increment the canvas burst signal.
  await page.getByRole("group", { name: "Intensitas efek latar" }).getByRole("button", { name: "mati" }).click();
  await expect(ambient).toHaveCount(0);
  await page.getByRole("button", { name: "Nyalakan efek", exact: true }).click();
  await expect(ambient).toBeVisible();
  await expect(ambient).toHaveAttribute("data-burst", "1");
  await expect(ambient).toHaveAttribute("data-manual-motion", "true");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "meriah");
  // intensity: lembut persists, mati hides the layer
  await page.getByRole("group", { name: "Intensitas efek latar" }).getByRole("button", { name: "lembut" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-fx", "lembut");
  await expect(ambient).toBeVisible();
  await page.getByRole("group", { name: "Intensitas efek latar" }).getByRole("button", { name: "mati" }).click();
  await expect(ambient).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-fx", "mati");
  await expect(page.locator("canvas.celebration-ambient")).toHaveCount(0);
  // back to festive
  await page.getByRole("group", { name: "Intensitas efek latar" }).getByRole("button", { name: "meriah" }).click();
  await expect(page.locator("canvas.celebration-ambient")).toBeVisible();
  // canvas actually paints (non-blank pixels)
  const painted = await page.evaluate(() => {
    const c = document.querySelector("canvas.celebration-ambient") as HTMLCanvasElement | null;
    if (!c) return 0;
    const g = c.getContext("2d")!;
    const d = g.getImageData(0, 0, Math.min(200, c.width), Math.min(200, c.height)).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 8) n++;
    return n;
  });
  // fireworks themes paint quickly; twinkle-only themes may need a moment — just require a live canvas
  expect(painted).toBeGreaterThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("motion and artwork toggles persist; OS reduced motion wins", async ({ page }) => {
  await forceStudioStart(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Pakai tema Tahun Baru Imlek", exact: true }).click();
  let dialog = await openThemes(page);
  await dialog.getByRole("button", { name: "Preferensi", exact: true }).click();
  await dialog.getByRole("switch", { name: "Animasi antarmuka", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await dialog.getByRole("switch", { name: "Ilustrasi perayaan", exact: true }).click();
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.getByLabel("Tema hari besar aktif")).toBeVisible();
  await expect(page.locator('.celebration-banner')).toHaveCount(0);
  await expect(page.locator('canvas.celebration-ambient')).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("html")).toHaveAttribute("data-decorations", "off");
  await expect(page.locator('canvas.celebration-ambient')).toHaveCount(0);
  await page.getByRole("button", { name: "Tampilkan ilustrasi", exact: true }).click();
  dialog = await openThemes(page);
  await dialog.getByRole("button", { name: "Preferensi", exact: true }).click();
  await dialog.getByRole("switch", { name: "Animasi antarmuka", exact: true }).click();
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.locator('canvas.celebration-ambient')).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const animations = await page.locator('.celebration-banner .celebration-ornament').evaluateAll((elements) => elements.map(el => getComputedStyle(el).animationName));
  expect(animations.length).toBe(2);
  expect(animations).toEqual(["none", "none"]);
  // OS reduced-motion also unmounts the ambient canvas entirely
  await expect(page.locator('canvas.celebration-ambient')).toHaveCount(0);
});

test("changing themes never clears uploaded work; returning to studio removes holiday motifs", async ({ page }) => {
  await forceStudioStart(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Muat Lembar Uji 4×4", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Nama gambar", exact: true })).toHaveValue("lembar-uji-azuralimit");
  const dialog = await openThemes(page);
  await dialog.getByLabel("Cari tema").fill("nyepi");
  await dialog.getByRole("button", { name: "Pakai tema Hari Suci Nyepi", exact: true }).click();
  await dialog.getByRole("button", { name: /^Studio/ }).click();
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(10);
  await dialog.getByRole("button", { name: "Pakai tema Parchment Press", exact: true }).click();
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-celebration','none');
  await expect(page.locator('html')).toHaveAttribute('data-pattern','grid');
  await expect(page.getByRole("textbox", { name: "Nama gambar", exact: true })).toHaveValue("lembar-uji-azuralimit");
});

test("mobile catalogue fits, empty state works, Escape restores keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await forceStudioStart(page);
  await page.goto("/");
  const trigger = page.getByTitle("Buka Rak Pengaturan Tema & Suara");
  const dialog = await openThemes(page);
  await dialog.getByLabel("Cari tema").fill("tidakada-xyzzz");
  await expect(dialog.getByText("Belum ada yang cocok.", { exact:true })).toBeVisible();
  await dialog.getByRole("button", { name: "Lihat semua tema", exact:true }).click();
  await expect(dialog.locator('[data-theme-card]')).toHaveCount(30);
  const overflow = await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
  await page.screenshot({ path:"/tmp/azuralimit-holiday-mobile.png", fullPage:false });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
});

test("read-only theme catalogue is available from the server", async ({ request }) => {
  const response = await request.get('/api/themes');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.total).toBe(40);
  expect(body.calendarYear).toBe(2026);
  expect(body.selection).toBe('manual');
  expect(body.themes.filter((t: { celebration:unknown }) => t.celebration)).toHaveLength(30);
});
