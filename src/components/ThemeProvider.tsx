"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, applySettings, loadSettings, normalizeSettings, saveSettings, themeById, type Settings } from "@/lib/theme";
import { setSoundOn } from "@/lib/sound";
import { burst, rain } from "./Particles";

interface AmbientSignal { id: string; nonce: number }
interface Ctx {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  reset: () => void;
  ready: boolean;
  reducedMotion: boolean;
  chooseTheme: (id: string) => void;
  toggleFavorite: (id: string) => void;
  triggerAmbient: (id: string) => void;
  ambientSignal: AmbientSignal;
  celebrate: (x: number, y: number, count?: number, power?: number) => void;
  rainFx: (count?: number) => void;
}
const SettingsCtx = createContext<Ctx | null>(null);
export function useAzura(): Ctx {
  const context = useContext(SettingsCtx);
  if (!context) throw new Error("useAzura must be used inside <ThemeProvider>");
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ambientSignal, setAmbientSignal] = useState<AmbientSignal>({ id: "", nonce: 0 });

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    const sync = (event: StorageEvent) => {
      if (event.key === SETTINGS_KEY) setSettings(loadSettings());
    };
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    applySettings(settings);
    saveSettings(settings);
    setSoundOn(settings.sound);
  }, [settings, ready]);

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => normalizeSettings({ ...prev, ...patch }));
  }, []);

  const chooseTheme = useCallback((id: string) => {
    const selected = themeById(id);
    setSettings((prev) => ({
      ...prev,
      theme: selected.id,
      accent: null,
      pattern: selected.celebration ? "heritage" : prev.pattern === "heritage" ? "grid" : prev.pattern,
    }));
  }, []);

  const triggerAmbient = useCallback((id: string) => {
    const selected = themeById(id);
    if (!selected.celebration) return;
    // The CTA opts into animation, even if the saved preference was previously off.
    setSettings((prev) => ({
      ...prev,
      theme: selected.id,
      accent: null,
      pattern: "heritage",
      decorations: true,
      motion: true,
      fx: "meriah",
    }));
    // Explicit action stays available even if the OS requests reduced motion.
    setAmbientSignal((prev) => ({ id: selected.id, nonce: prev.nonce + 1 }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    if (themeById(id).id !== id) return;
    setSettings((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(id)
        ? prev.favorites.filter((favorite) => favorite !== id)
        : [...prev.favorites, id],
    }));
  }, []);

  const reset = useCallback(() => {
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, sound: prev.sound, favorites: prev.favorites }));
  }, []);

  const celebrate = useCallback((x: number, y: number, count = 30, power = 1) => {
    if (settings.particles && settings.motion && !reducedMotion) burst(x, y, count, power);
  }, [settings.particles, settings.motion, reducedMotion]);
  const rainFx = useCallback((count = 70) => {
    if (settings.particles && settings.motion && !reducedMotion) rain(count);
  }, [settings.particles, settings.motion, reducedMotion]);

  const value = useMemo<Ctx>(() => ({
    settings, set, reset, ready, reducedMotion, chooseTheme, toggleFavorite,
    triggerAmbient, ambientSignal, celebrate, rainFx,
  }), [settings, set, reset, ready, reducedMotion, chooseTheme, toggleFavorite, triggerAmbient, ambientSignal, celebrate, rainFx]);

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
