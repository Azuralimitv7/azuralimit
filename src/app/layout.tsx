import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
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
        
        {/* Monetag In-Page Push 11912513 */}
        <Script
          id="monetag-inpage"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(s){s.dataset.zone='11912513',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
          }}
        />
        {/* Monetag Push Superior 11912659 */}
        <Script
          src="https://5gvci.com/act/files/tag.min.js?z=11912659"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}