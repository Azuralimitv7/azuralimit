import { NextResponse } from "next/server";
import { CALENDAR_SOURCE, CALENDAR_YEAR, celebrationAssets } from "@/lib/celebrations";
import { fxForCelebration } from "@/lib/celebrationFx";
import { THEMES } from "@/lib/theme";

/** Public read-only catalogue. No user files, analytics, database writes or remote calls. */
export function GET() {
  return NextResponse.json({
    version: 2,
    calendarYear: CALENDAR_YEAR,
    calendarSource: CALENDAR_SOURCE,
    total: THEMES.length,
    selection: "manual",
    themes: THEMES.map((theme) => ({
      id: theme.id, name: theme.name, mode: theme.mode, description: theme.blurb,
      palette: theme.swatch,
      celebration: theme.celebration || null,
      assets: theme.celebration ? celebrationAssets(theme.id) : null,
      ambientFx: theme.celebration ? (fxForCelebration(theme.id)?.label ?? null) : null,
    })),
  }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" } });
}
