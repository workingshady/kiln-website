import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Kiln: shaders, fired live";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card: the kiln mouth glow, the mark and the headline in the site's display face.
// Satori can't read woff2, so the card has its own TTF.
export default async function OG() {
  const display = await readFile(join(process.cwd(), "app/fonts/BigShoulders-800.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "64px 72px", color: "#f4e9df", fontFamily: "Big Shoulders",
          background: "radial-gradient(ellipse 900px 620px at 88% 115%, #ffc04d 0%, #ff8a3d 18%, #d9452b 38%, #3a1420 64%, #120d12 88%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="76" height="76" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c9744d" />
                <stop offset="1" stopColor="#8e4229" />
              </linearGradient>
              <radialGradient id="m" cx="0.5" cy="0.85" r="0.9">
                <stop offset="0" stopColor="#fff0b8" />
                <stop offset="0.45" stopColor="#ffc04d" />
                <stop offset="1" stopColor="#ff7a45" />
              </radialGradient>
            </defs>
            <path d="M8 56C8 32 18 16 32 16s24 16 24 40Z" fill="url(#b)" />
            <path d="M22 56V44a10 10 0 0 1 20 0v12Z" fill="#3b1a14" />
            <path d="M24 56V44.5a8 8 0 0 1 16 0V56Z" fill="url(#m)" />
            <rect x="5" y="55" width="54" height="4" rx="1.5" fill="#3b1a14" />
            <rect x="29" y="8" width="6" height="6" fill="#ffc04d" />
            <rect x="22" y="3" width="4" height="4" fill="#ff6f9b" />
            <rect x="38" y="2" width="3.5" height="3.5" fill="#ffd66b" />
          </svg>
          <span style={{ fontSize: 60, letterSpacing: 1 }}>KILN</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 140, lineHeight: 1 }}>SHADERS,</span>
          <span style={{ fontSize: 140, lineHeight: 1, color: "#ffc04d" }}>FIRED LIVE.</span>
          <span style={{ fontSize: 32, marginTop: 26, color: "#e6d3c8", letterSpacing: 0.5 }}>
            LIVE SHADER EDITOR FOR MOBILE VIDEO · WINDOWS &amp; MACOS · FREE
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Big Shoulders", data: display, weight: 800, style: "normal" }] },
  );
}
