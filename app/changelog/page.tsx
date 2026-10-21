import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in Kiln.",
  alternates: { canonical: "/changelog" },
};

const LOG: { date: string; title: string; items: string[] }[] = [
  {
    date: "2026-10-20",
    title: "A real Mac app, and a name",
    items: [
      "Shader Studio is now Kiln. Projects use .kiln, and older .ssproj files still open.",
      "Every macOS build produces Kiln.app with its own icon. Double-click a .kiln project in Finder, or drop files on the Dock icon.",
      "cpack builds a DMG to share.",
      "New example: examples/molten.frag, the shader running on this site's home page.",
    ],
  },
  {
    date: "2026-10-20",
    title: "Batch render and remembered export settings",
    items: [
      "Export → Batch… renders every shader in a folder, with per-file status and Retry failed.",
      "Export settings are saved with the project and as defaults; files are named after the project.",
      "Exports are written to .part and renamed only when complete. Nothing is overwritten without asking.",
      "One-click per-format recommendations, and a warning before a GIF that would need gigabytes of memory.",
    ],
  },
  {
    date: "2026-10-20",
    title: "GIF and WebP export",
    items: [
      "Animated GIF with one optimised 256-colour palette for the whole clip.",
      "Animated WebP, lossy with a quality slider or lossless, with alpha.",
    ],
  },
  {
    date: "2026-10-17",
    title: "The first firing",
    items: [
      "Live GLSL editing with dialect conversion, multipass, textures, audio, timeline and keyframes.",
      "Mobile ES checks, Metal conversion, MP4 and ProRes export, history, library and the AI assistant.",
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <span className="temp"><b>Changelog</b> firing log</span>
          <h1>What came<br />out of the kiln</h1>
        </div>
      </header>
      <div className="wrap">
        <ol className="log">
          {LOG.map((e) => (
            <li key={e.title} data-reveal>
              <time dateTime={e.date}>{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>
              <div>
                <h3>{e.title}</h3>
                <ul>{e.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            </li>
          ))}
        </ol>
        <div style={{ height: 100 }} />
      </div>
    </>
  );
}
