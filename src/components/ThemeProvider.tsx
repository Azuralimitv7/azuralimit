"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  applySettings,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/theme";
import { setSoundOn } from "@/lib/sound";
import { burst, rain } from "./Particles";

interface Ctx {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  reset: () => void;
  ready: boolean;
  celebrate: (x: number, y: number, count?: number, power?: number) => void;
  rainFx: (count?: number) => void;
}

const SettingsCtx = createContext<Ctx | null>(null);

export function useAzura(): Ctx {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("useAzura must be used inside <ThemeProvider>");
  return c;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
    setSoundOn(s.sound);
    setReady(true);
  }, []);

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applySettings(next);
      saveSettings(next);
      if (patch.sound !== undefined) setSoundOn(patch.sound);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings((prev) => {
      const next = { ...DEFAULT_SETTINGS, sound: prev.sound };
      applySettings(next);
      saveSettings(next);
      setSoundOn(next.sound);
      return next;
    });
  }, []);

  const celebrate = useCallback(
    (x: number, y: number, count = 30, power = 1) => {
      if (!settings.particles) return;
      burst(x, y, count, power);
    },
    [settings.particles],
  );

  const rainFx = useCallback(
    (count = 70) => {
      if (!settings.particles) return;
      rain(count);
    },
    [settings.particles],
  );

  const value = useMemo<Ctx>(
    () => ({ settings, set, reset, ready, celebrate, rainFx }),
    [settings, set, reset, ready, celebrate, rainFx],
  );

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
