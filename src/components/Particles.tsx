"use client";

import { useEffect, useRef } from "react";

/* Global confetti / particle system rendered on a fixed canvas. */

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  ttl: number;
  shape: 0 | 1;
}

const COLORS = [
  "#C47623",
  "#781C2E",
  "#00594E",
  "#124D95",
  "#D2B48C",
  "#E9F5FF",
  "#F9F6EE",
];

let parts: P[] = [];
let rafId = 0;
let canvas: HTMLCanvasElement | null = null;

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function push(p: P) {
  parts.push(p);
  ensureLoop();
}

export function burst(x: number, y: number, count = 30, power = 1) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rnd(2, 7) * power;
    push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 2.4 * power,
      rot: rnd(0, 6.3),
      vr: rnd(-0.25, 0.25),
      w: rnd(4, 10),
      h: rnd(2, 5),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 0,
      ttl: rnd(50, 95),
      shape: Math.random() < 0.45 ? 1 : 0,
    });
  }
}

export function rain(count = 90) {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  for (let i = 0; i < count; i++) {
    push({
      x: Math.random() * w,
      y: rnd(-120, -10),
      vx: rnd(-1, 1),
      vy: rnd(1.5, 4),
      rot: rnd(0, 6.3),
      vr: rnd(-0.2, 0.2),
      w: rnd(5, 11),
      h: rnd(3, 6),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 0,
      ttl: rnd(120, 220),
      shape: Math.random() < 0.4 ? 1 : 0,
    });
  }
}

function ensureLoop() {
  if (rafId || !canvas || parts.length === 0) return;
  rafId = requestAnimationFrame(tick);
}

function tick() {
  const c = canvas;
  if (!c) {
    rafId = 0;
    return;
  }
  const ctx = c.getContext("2d");
  if (!ctx) {
    rafId = 0;
    return;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (c.width !== window.innerWidth * dpr || c.height !== window.innerHeight * dpr) {
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const next: P[] = [];
  for (const p of parts) {
    p.life++;
    p.vy += 0.13;
    p.vx *= 0.992;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    if (p.life < p.ttl && p.y < window.innerHeight + 30) next.push(p);
  }
  parts = next;

  for (const p of parts) {
    const alpha = Math.max(0, 1 - p.life / p.ttl);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.shape === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  if (parts.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    rafId = 0;
  }
}

export default function ParticlesCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    canvas = ref.current;
    const onResize = () => {
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ensureLoop();
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      canvas = null;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
      aria-hidden
    />
  );
}
