"use client";

import { useEffect, useRef } from "react";
import { useAzura } from "./ThemeProvider";
import { clamp } from "@/lib/types";
import { themeById } from "@/lib/theme";
import { densityFor, fxForCelebration, type FxShape } from "@/lib/celebrationFx";

/* Full-screen celebration atmosphere, drawn locally on canvas.
 * Fireworks, lanterns, petals, snow, embers — choreographed per occasion.
 * Respects decorations / motion / reduced-motion / fx level toggles.
 */

interface Rocket { x: number; y: number; vx: number; vy: number; targetY: number; color: string; trail: { x: number; y: number }[]; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number; color: string; }
interface Drift { x: number; y: number; vx: number; vy: number; size: number; color: string; shape: FxShape; rot: number; vr: number; phase: number; sway: number; dir: 1 | -1; }
interface Twinkle { x: number; y: number; size: number; color: string; phase: number; freq: number; }
interface Ember { x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number; color: string; phase: number; }
interface Flash { x: number; y: number; r: number; alpha: number; decay: number; color: string; }

function rnd(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[(Math.random() * arr.length) | 0]; }

function drawStar4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: FxShape, x: number, y: number, s: number, color: string, rot: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case "snow":
    case "dot": {
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "star": {
      drawStar4(ctx, 0, 0, s * 1.6, color, 1);
      break;
    }
    case "spark": {
      ctx.fillRect(-s * 0.3, -s * 1.4, s * 0.6, s * 2.8);
      ctx.fillRect(-s * 1.4, -s * 0.3, s * 2.8, s * 0.6);
      break;
    }
    case "petal": {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
      break;
    }
    case "leaf": {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.9, 0, 0, s);
      ctx.quadraticCurveTo(-s * 0.9, 0, 0, -s);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.stroke();
      break;
    }
    case "feather": {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.42, s * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s * 1.1); ctx.lineTo(0, s * 1.3); ctx.stroke();
      break;
    }
    case "confetti": {
      ctx.fillRect(-s * 0.7, -s * 0.45, s * 1.4, s * 0.9);
      break;
    }
    case "ribbon": {
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.4);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.9, s * 0.2, -s * 0.3);
      ctx.quadraticCurveTo(s * 0.6, s * 0.2, s, -s * 0.2);
      ctx.lineTo(s, s * 0.3);
      ctx.quadraticCurveTo(s * 0.4, s * 0.7, -s * 0.2, s * 0.2);
      ctx.quadraticCurveTo(-s * 0.6, -s * 0.1, -s, s * 0.3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "ketupat": {
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.8, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,246,228,0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.5); ctx.lineTo(s * 0.4, s * 0.5);
      ctx.moveTo(s * 0.4, -s * 0.5); ctx.lineTo(-s * 0.4, s * 0.5);
      ctx.moveTo(0, -s); ctx.lineTo(0, s);
      ctx.stroke();
      break;
    }
    case "lantern": {
      // glowing mini lantern
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.72, s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,246,228,0.85)";
      ctx.fillRect(-s * 0.3, -s * 1.15, s * 0.6, s * 0.22);
      ctx.fillRect(-s * 0.25, s * 0.95, s * 0.5, s * 0.18);
      ctx.strokeStyle = "rgba(255,246,228,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.38, s * 0.92, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case "balloon": {
      ctx.beginPath(); ctx.ellipse(0, -s * 0.3, s * 0.72, s * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, s * 0.6); ctx.lineTo(s * 0.16, s * 0.6); ctx.lineTo(0, s * 0.85);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, s * 0.85); ctx.quadraticCurveTo(s * 0.4, s * 1.4, 0, s * 1.9); ctx.stroke();
      break;
    }
    case "heart": {
      const k = s * 0.9;
      ctx.beginPath();
      ctx.moveTo(0, k * 0.9);
      ctx.bezierCurveTo(-k * 1.3, -k * 0.1, -k * 0.6, -k, 0, -k * 0.35);
      ctx.bezierCurveTo(k * 0.6, -k, k * 1.3, -k * 0.1, 0, k * 0.9);
      ctx.fill();
      break;
    }
    case "ember": {
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath(); ctx.arc(0, 0, s * 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export default function CelebrationAmbient() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { settings, reducedMotion, ambientSignal } = useAzura();
  const theme = themeById(settings.theme);
  const celebrationId = theme.celebration?.id ?? null;
  const manualBurst = Boolean(celebrationId && ambientSignal.id === celebrationId && ambientSignal.nonce > 0);

  const active =
    !!celebrationId &&
    settings.decorations &&
    settings.motion &&
    (!reducedMotion || manualBurst) &&
    settings.fx !== "mati";

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active || !celebrationId) return;
    const fx = fxForCelebration(celebrationId);
    if (!fx) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let rocketAcc = 0.6;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const drifts: Drift[] = [];
    const twinkles: Twinkle[] = [];
    const embers: Ember[] = [];
    const flashes: Flash[] = [];

    const fxLevel = manualBurst ? "meriah" : settings.fx;
    const density = () => densityFor(fxLevel, W);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initTwinkles();
    };

    const initTwinkles = () => {
      twinkles.length = 0;
      const n = Math.round((fx.twinkle?.count ?? 0) * density());
      for (let i = 0; i < n; i++) {
        twinkles.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.85,
          size: rnd(fx.twinkle!.size[0], fx.twinkle!.size[1]),
          color: pick(fx.twinkle!.colors),
          phase: Math.random() * Math.PI * 2,
          freq: rnd(0.6, 2.2),
        });
      }
      if (!fx.twinkle) return;
    };

    const spawnDrift = (kind: "falling" | "rising", initial: boolean) => {
      const cfg = kind === "falling" ? fx.falling : fx.rising;
      if (!cfg) return;
      const shape = pick(cfg.shapes);
      const size = rnd(cfg.size[0], cfg.size[1]);
      const speed = rnd(cfg.speed[0], cfg.speed[1]);
      drifts.push({
        x: Math.random() * W,
        y: initial ? Math.random() * H : kind === "falling" ? -20 : H + 20,
        vx: 0,
        vy: kind === "falling" ? speed : -speed,
        size,
        color: pick(cfg.colors),
        shape,
        rot: Math.random() * Math.PI * 2,
        vr: rnd(-1.2, 1.2),
        phase: Math.random() * Math.PI * 2,
        sway: cfg.sway * rnd(0.4, 1),
        dir: kind === "falling" ? 1 : -1,
      });
    };

    const seedDrifts = () => {
      drifts.length = 0;
      const d = density();
      const fallN = Math.round((fx.falling?.count ?? 0) * d);
      const riseN = Math.round((fx.rising?.count ?? 0) * d);
      for (let i = 0; i < fallN; i++) spawnDrift("falling", true);
      for (let i = 0; i < riseN; i++) spawnDrift("rising", true);
    };

    const launchRocket = () => {
      const colors = fx.fireworks!.colors;
      const x = rnd(W * 0.08, W * 0.92);
      const targetY = rnd(H * 0.08, H * 0.45);
      rockets.push({
        x, y: H + 10, vx: rnd(-24, 24), vy: -rnd(H * 0.75, H * 1.05),
        targetY, color: pick(colors), trail: [],
      });
    };

    const explode = (r: Rocket) => {
      const power = fx.fireworks!.power;
      const colors = fx.fireworks!.colors;
      const main = r.color;
      const secondary = pick(colors);
      // main spherical burst — big and bright
      const count = Math.round(rnd(70, 105) * power);
      const speedBase = rnd(150, 300) * power;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + rnd(-0.12, 0.12);
        const sp = speedBase * rnd(0.35, 1);
        sparks.push({
          x: r.x, y: r.y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, ttl: rnd(1.1, 2.2), size: rnd(2, 3.6),
          color: Math.random() < 0.72 ? main : secondary,
        });
      }
      // inner contrast ring, slower and tighter
      const ring = Math.round(26 * power);
      for (let i = 0; i < ring; i++) {
        const a = (i / ring) * Math.PI * 2;
        const sp = speedBase * 0.45;
        sparks.push({
          x: r.x, y: r.y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, ttl: rnd(1.3, 2.0), size: rnd(1.8, 3),
          color: "#FFF6E4",
        });
      }
      // slow golden embers lingering after the burst
      for (let i = 0; i < 14; i++) {
        sparks.push({
          x: r.x + rnd(-10, 10), y: r.y + rnd(-10, 10),
          vx: rnd(-26, 26), vy: rnd(-12, 46),
          life: 0, ttl: rnd(1.8, 2.8), size: rnd(1.2, 2.2), color: "#D2B48C",
        });
      }
      flashes.push({ x: r.x, y: r.y, r: 95 * power, alpha: 0.7, decay: 1.5, color: main });
      if (sparks.length > 900) sparks.splice(0, sparks.length - 900);
    };

    const spawnEmber = (initial: boolean) => {
      if (!fx.embers) return;
      embers.push({
        x: Math.random() * W,
        y: initial ? Math.random() * H : H + 12,
        vx: rnd(-14, 14), vy: -rnd(24, 70),
        life: 0, ttl: rnd(3, 7),
        size: rnd(1.2, 3.2),
        color: pick(fx.embers.colors),
        phase: Math.random() * Math.PI * 2,
      });
    };

    resize();
    seedDrifts();
    if (fx.embers) {
      const n = Math.round(fx.embers.count * density());
      for (let i = 0; i < n; i++) spawnEmber(true);
    }
    // Opening celebration: immediately send visible rockets on festive themes.
    if (fx.fireworks && fxLevel === "meriah") {
      const openingVolley = Math.min(fx.fireworks.maxRockets, manualBurst ? 2 : 3);
      for (let i = 0; i < openingVolley; i++) launchRocket();
    }
    // The explicit CTA also creates an immediate on-screen explosion at click time.
    if (manualBurst && fx.fireworks) {
      const volleys = Math.min(3, fx.fireworks.maxRockets);
      for (let i = 0; i < volleys; i++) {
        const lane = i - (volleys - 1) / 2;
        explode({
          x: clamp(W * (0.5 + lane * 0.21) + rnd(-25, 25), W * 0.14, W * 0.86),
          y: rnd(H * 0.12, H * 0.4),
          vx: 0, vy: 0, targetY: 0,
          color: fx.fireworks.colors[i % fx.fireworks.colors.length], trail: [],
        });
      }
    } else if (manualBurst) {
      // Themes without fireworks get a clear, occasion-coloured celebration burst.
      for (let i = 0; i < 42; i++) {
        if (fx.falling) spawnDrift("falling", true);
        if (fx.rising) spawnDrift("rising", true);
        if (fx.embers) spawnEmber(true);
      }
      if (!fx.falling && !fx.rising && !fx.embers) {
        for (let i = 0; i < 34; i++) {
          const a = i / 34 * Math.PI * 2;
          sparks.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * rnd(100, 240), vy: Math.sin(a) * rnd(100, 240), life: 0, ttl: 1.5, size: 2.5, color: pick(fx.twinkle?.colors ?? ["#FFF6E4", "#D2B48C"]) });
        }
      }
    }

    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) { last = now; return; }
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      elapsed += dt;
      const d = density();

      ctx.clearRect(0, 0, W, H);

      // twinkling stars
      for (const t of twinkles) {
        const a = 0.25 + 0.75 * Math.abs(Math.sin(elapsed * t.freq + t.phase));
        drawStar4(ctx, t.x, t.y, t.size * 2.1, t.color, a * 0.85);
      }

      // explosion flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.alpha -= dt * f.decay;
        f.r += dt * 60;
        if (f.alpha <= 0) { flashes.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, f.color + "");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha) * 0.35;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // fireworks rockets
      if (fx.fireworks) {
        rocketAcc += dt * fx.fireworks.rate * (settings.fx === "lembut" ? 0.4 : 1) * d;
        while (rocketAcc >= 1 && rockets.length < fx.fireworks.maxRockets) {
          launchRocket();
          rocketAcc -= 1;
        }
        if (rocketAcc > 3) rocketAcc = 3;
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 9) r.trail.shift();
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 160 * dt;
          ctx.save();
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          for (let k = 1; k < r.trail.length; k++) {
            ctx.globalAlpha = (k / r.trail.length) * 0.8;
            ctx.beginPath();
            ctx.moveTo(r.trail[k - 1].x, r.trail[k - 1].y);
            ctx.lineTo(r.trail[k].x, r.trail[k].y);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#FFF6E4";
          ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          if (r.y <= r.targetY || r.vy >= -40) {
            explode(r);
            rockets.splice(i, 1);
          }
        }
        // sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life += dt;
          if (s.life >= s.ttl) { sparks.splice(i, 1); continue; }
          s.vy += 165 * dt;
          s.vx *= 1 - 0.9 * dt;
          s.vy *= 1 - 0.35 * dt;
          const px = s.x, py = s.y;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const a = 1 - s.life / s.ttl;
          ctx.save();
          ctx.globalAlpha = Math.max(0, a);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(px - s.vx * 0.028, py - s.vy * 0.028);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // drifting particles (falling + rising) — maintain population
      const wantFall = Math.round((fx.falling?.count ?? 0) * d);
      const wantRise = Math.round((fx.rising?.count ?? 0) * d);
      let fallCount = 0, riseCount = 0;
      for (const p of drifts) { if (p.dir === 1) fallCount++; else riseCount++; }
      for (let i = fallCount; i < wantFall; i++) spawnDrift("falling", false);
      for (let i = riseCount; i < wantRise; i++) spawnDrift("rising", false);

      for (let i = drifts.length - 1; i >= 0; i--) {
        const p = drifts[i];
        p.phase += dt * 1.6;
        p.rot += p.vr * dt;
        p.x += (p.vx + Math.sin(p.phase) * p.sway * 0.45) * dt;
        p.y += p.vy * dt;
        const margin = 34;
        const out = p.dir === 1 ? p.y > H + margin : p.y < -margin;
        const want = p.dir === 1 ? wantFall : wantRise;
        const have = p.dir === 1 ? fallCount : riseCount;
        if (out || p.x < -margin || p.x > W + margin) {
          drifts.splice(i, 1);
          if (have <= want + 2) spawnDrift(p.dir === 1 ? "falling" : "rising", false);
          continue;
        }
        // fade near vertical edges
        const edge = Math.min(1, p.y / 60, (H - p.y) / 60);
        const alpha = Math.max(0.25, Math.min(1, edge)) * 0.92;
        drawShape(ctx, p.shape, p.x, p.y, p.size, p.color, p.rot, alpha);
      }

      // embers / fireflies
      if (fx.embers) {
        const want = Math.round(fx.embers.count * d);
        while (embers.length < want) spawnEmber(false);
        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i];
          e.life += dt;
          e.phase += dt * 6;
          if (e.life >= e.ttl || e.y < -16) { embers.splice(i, 1); continue; }
          e.x += (e.vx + Math.sin(e.phase * 0.7) * 12) * dt;
          e.y += e.vy * dt;
          const flicker = 0.55 + 0.45 * Math.sin(e.phase);
          const fade = Math.min(1, (e.ttl - e.life) / 1.2, e.life / 0.4 + 0.2);
          drawShape(ctx, "ember", e.x, e.y, e.size, e.color, 0, flicker * fade);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active, celebrationId, settings.fx, ambientSignal.nonce]);

  if (!active || !celebrationId) return null;
  return (
    <canvas
      ref={ref}
      className="celebration-ambient"
      data-celebration-fx={celebrationId}
      data-burst={manualBurst ? ambientSignal.nonce : 0}
      data-manual-motion={manualBurst ? "true" : "false"}
      aria-hidden="true"
    />
  );
}
