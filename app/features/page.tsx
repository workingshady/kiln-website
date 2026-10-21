import type { Metadata } from "next";
import { DownloadButton } from "@/components/Download";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything in Kiln: GLSL dialect conversion, uniform controls, keyframes, video and audio textures, mobile ES checks, Metal conversion, and MP4, ProRes, GIF and WebP export.",
  alternates: { canonical: "/features" },
};

const GROUPS: { temp: string; color: string; title: string; intro: string; items: [string, string][] }[] = [
  {
    temp: "600 °C", color: "#d9452b", title: "Write", intro: "The editor, and what Kiln accepts.",
    items: [
      ["GLSL dialects", "#version 330+ runs as written. GLSL ES 1.00, #version 300 es, Shadertoy mainImage() and gl-transitions transition() are converted automatically, and error line numbers still match your file."],
      ["Includes", "#include \"file.glsl\" looks in the shader's folder, then the project folder, then your config includes folder."],
      ["Autocomplete", "GLSL keywords and built-ins, plus your own uniforms and identifiers. Ctrl+Space forces it."],
      ["Compile speed", "Recompiles 120 ms after your last keystroke (adjustable, or 0 for every keystroke). Big shaders stay responsive."],
      ["Templates", "Basic, Video effect (GLSL ES), Transition, Shadertoy, Multipass feedback and Audio reactive."],
      ["AI assistant", "Uses the Claude API with your own key: write a shader, change the current pass, or explain and fix errors. Apply with one click."],
    ],
  },
  {
    temp: "900 °C", color: "#ff8a3d", title: "Shape", intro: "Controls, inputs and time.",
    items: [
      ["Uniform controls", "Found when the shader compiles. // @slider, @color, @toggle and @drag comments become controls, as do gl-transitions // = default comments."],
      ["Uniform modes", "Each uniform can be Manual, Time, Loop 0..1, Keyframes, or follow the first video's playback."],
      ["Defines", "#ifndef / #define pairs (like EFFECT_ID in an uber-shader) appear as controls. Variants you've compiled are cached, so switching back is instant."],
      ["Textures", "Images, video files, camera, audio file, microphone, noise and checker. No fixed count: your GPU's limit applies."],
      ["Audio", "512×2 audio textures (spectrum and waveform, Shadertoy layout) plus u_audioLevel, u_bass, u_mid and u_high. Tick Hear it to listen while you preview."],
      ["Timeline", "Duration, loop and scrub bar. Drag keyframe diamonds, right-click for easing, double-click a track to add a key."],
      ["Transitions", "Choose From and To textures, then scrub, play or keyframe progress."],
      ["Multipass", "Buffers A–D (16-bit float) plus the Image pass. Read any pass with u_bufferA…D and this pass's last frame with u_prev."],
    ],
  },
  {
    temp: "1100 °C", color: "#ffc04d", title: "Check", intro: "Making sure it runs where it has to.",
    items: [
      ["Device presets", "Desktop, Android phone and iPhone. Phone presets set 1080×1920, a top-left UV origin and mobile checking."],
      ["Mobile ES check", "On every compile, glslang checks your original source as a phone would, catching things like a missing precision qualifier."],
      ["Metal", "GLSL → SPIR-V → MSL for iOS or macOS, with a button to check the result using Xcode's metal compiler."],
      ["Inspect", "View any pass, isolate R, G, B, A or luma, and read exact pixel values with a loupe."],
      ["Performance", "GPU time per pass from timer queries, a CPU frame-time graph and cost per megapixel."],
    ],
  },
  {
    temp: "1300 °C", color: "#fff0b8", title: "Ship", intro: "Getting pixels out.",
    items: [
      ["Export", "PNG frame or sequence, MP4 (H.264), MOV (ProRes 422 HQ), animated GIF with one optimised palette, animated WebP (lossy or lossless, with alpha). Any size, fps and length."],
      ["Safe writes", "Exports go to a .part file and are renamed only when complete. Existing files are never overwritten without asking."],
      ["Remembered settings", "Export settings are saved with the project and as defaults. Files are named after the project, and one click applies per-format recommendations."],
      ["Batch render", "Render every shader in a folder into renders/, with per-file status, a failed file that doesn't stop the batch, and Retry failed."],
      ["Output window", "Show the output windowed or full screen on any monitor, for projectors and VJ sets."],
    ],
  },
  {
    temp: "Kiln", color: "#ff6f9b", title: "Keep", intro: "Projects and history.",
    items: [
      ["Projects", ".kiln files (JSON) store passes, textures, uniform values, keyframes, settings and history. Your session is restored when you reopen."],
      ["History", "A snapshot on every successful compile. Diff any snapshot against the current code and restore it."],
      ["Library", "Projects saved with thumbnails in Documents/Kiln/Library, searchable."],
      ["Headless runs", "KILN_EXPORT and KILN_BATCH environment variables render without touching the UI, for CI."],
    ],
  },
];

export default function Features() {
  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <span className="temp"><b>Features</b> the whole firing</span>
          <h1>Every tool<br />in the kiln</h1>
          <p className="lede">Grouped in the order you&apos;ll reach for them: write, shape, check, ship.</p>
        </div>
      </header>
      <div className="wrap">
        {GROUPS.map((g) => (
          <section key={g.title} className="feat-group" aria-labelledby={`g-${g.title}`}>
            <header>
              <span className="temp" style={{ "--t": g.color } as React.CSSProperties}><b>{g.temp}</b></span>
              <h2 id={`g-${g.title}`}>{g.title}</h2>
              <p>{g.intro}</p>
            </header>
            <dl className="spec" style={{ gridTemplateColumns: "1fr" }}>
              {g.items.map(([t, d]) => (
                <div key={t} data-reveal><dt>{t}</dt><dd>{d}</dd></div>
              ))}
            </dl>
          </section>
        ))}
        <div style={{ padding: "80px 0 120px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "clamp(36px,5vw,64px)" }}>Try it on<br />your shader</h2>
          <DownloadButton from="features" />
        </div>
      </div>
    </>
  );
}
