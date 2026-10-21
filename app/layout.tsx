import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { HeatGauge, Lightbox, RevealObserver } from "@/components/Effects";
import { Nav } from "@/components/Nav";
import { Tracker } from "@/components/Tracker";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted: next/font/google can't resolve Big Shoulders' files on Vercel. Variable font, Latin subset.
const display = localFont({ src: "./fonts/BigShoulders-latin.woff2", weight: "700 800", variable: "--f-display", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Kiln: live shader editor for mobile video effects", template: "%s · Kiln" },
  description:
    "Write GLSL, tune it with real sliders, check it compiles for phones and Metal, then export MP4, ProRes, GIF or WebP. Free for Windows and macOS.",
  keywords: ["shader editor", "GLSL", "live coding", "video effects", "transitions", "Shadertoy", "Metal", "KodeLife alternative"],
  openGraph: { type: "website", siteName: "Kiln", url: "/" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#120d12", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <HeatGauge />
        <RevealObserver />
        <Lightbox />
        <Tracker />
      </body>
    </html>
  );
}
