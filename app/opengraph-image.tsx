import { ImageResponse } from "next/og";

export const alt = "Kiln: shaders, fired live";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card: the kiln mouth glow, the mark and the headline.
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, background: "radial-gradient(ellipse 900px 600px at 85% 110%, #ff8a3d 0%, #d9452b 30%, #3a1420 60%, #120d12 85%)",
          color: "#f4e9df", fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <path d="M8 56C8 32 18 16 32 16s24 16 24 40Z" fill="#b5603e" />
            <path d="M24 56V44.5a8 8 0 0 1 16 0V56Z" fill="#ffc04d" />
            <rect x="29" y="8" width="6" height="6" fill="#ffc04d" />
            <rect x="22" y="3" width="4" height="4" fill="#ff6f9b" />
          </svg>
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: 2 }}>KILN</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 112, fontWeight: 800, lineHeight: 0.95 }}>Shaders,</span>
          <span style={{ fontSize: 112, fontWeight: 800, lineHeight: 0.95, color: "#ffc04d" }}>fired live.</span>
          <span style={{ fontSize: 30, marginTop: 28, color: "#e6d3c8" }}>
            The live shader editor for mobile video effects · Windows & macOS
          </span>
        </div>
      </div>
    ),
    size,
  );
}
