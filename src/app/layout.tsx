import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Azuralimit — Meja Potong Grid & Studio Sprite",
  description:
    "Meja kerja interaktif untuk memotong gambar grid 1x1 hingga 100x100, memperbesar resolusi tiap keping hingga 10x, potong sekaligus (batch), dan unduh bundel ZIP.",
  applicationName: "Azuralimit",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#002147",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        {children}
      </body>
    </html>
  );
}
