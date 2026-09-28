import { NextRequest, NextResponse } from "next/server";
import { renderQrSvg } from "@/lib/qr";

const ALLOWED_TARGETS: Record<string, string> = {
  dana: "https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012025053106592119",
  evm: "0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("target") || "evm";
  const fg = searchParams.get("fg") || "#002147";
  const bg = searchParams.get("bg") || "#FFF6E4";
  const payload = ALLOWED_TARGETS[key] || ALLOWED_TARGETS.evm;
  const svg = renderQrSvg(payload, { fg, bg, margin: 3 });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
