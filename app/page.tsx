import Link from "next/link";
import { DownloadButton } from "@/components/Download";
import { Embers } from "@/components/Embers";
import { ShaderHero } from "@/components/ShaderHero";
import { BatchDemo, DialectSwap, Shelf, StoryTour } from "@/components/Story";

const FORMATS = [
  ["MP4", "Handing a clip to anyone", "H.264, any size and fps, with the audio track if you used one"],
  ["MOV", "Editing and grading", "ProRes 422 HQ, with audio"],
  ["GIF", "Docs, chats, pull requests", "One optimised 256-colour palette for the whole clip, loops forever"],
  ["WebP", "The web, with transparency", "Lossy with a quality slider, or lossless; keeps alpha"],
  ["PNG", "Stills and compositing", "A single frame, or a numbered sequence"],
];

const ALSO = [
  ["Multipass", "Up to four 16-bit float buffers plus the image pass, and u_prev for feedback."],
  ["History", "A snapshot on every good compile. Diff any two side by side and restore."],
  ["Inspect", "Isolate R, G, B, A or luma, and read exact pixel values with a loupe."],
  ["Performance", "GPU time per pass, a frame-time graph and cost per megapixel."],
  ["Library", "Projects saved with thumbnails, searchable, one click to open."],
  ["AI assistant", "Ask Claude to write, change or fix a pass, then apply it in one click."],
  ["Overlay", "F2 floats the code over the full-screen output, KodeLife style."],
  ["Output window", "Send the output to any monitor for projectors and VJ sets."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <Embers />
        <div className="wrap hero-grid">
          <div>
            <h1>
              <span className="line"><span>Shaders,</span></span>
              <span className="line"><span className="hot" style={{ "--delay": "0.08s" } as React.CSSProperties}>fired</span></span>
              <span className="line"><span style={{ "--delay": "0.16s" } as React.CSSProperties}>live.</span></span>
            </h1>
            <p className="lede">
              Kiln is a live shader editor for the effects and transitions in mobile video apps. Write GLSL, tune it with real controls,
              check that it compiles for phones, and export the result.
            </p>
            <div className="hero-cta">
              <DownloadButton from="hero" />
              <a className="btn btn-ghost" href="#story" data-track="hero:story">How it works</a>
            </div>
            <p className="hero-meta">Free and open source · Windows and macOS · OpenGL 4.1</p>
          </div>
          <div>
            <ShaderHero />
            <p className="hero-meta" style={{ marginTop: 14 }}>
              ↑ This is <code>examples/molten.frag</code> from the Kiln repo, running in your browser. Drag the sliders.
            </p>
          </div>
        </div>
      </section>

      <div className="courses" aria-hidden />

      {/* Prologue: the problem, in one breath. */}
      <section className="sec" id="story">
        <div className="wrap">
          <p className="prologue" data-reveal>
            Every filter in a camera app starts as forty lines of GLSL that nobody can see until it&apos;s on a phone.
            <span> Kiln closes that loop. Here is one effect, from idea to a file you can ship.</span>
          </p>
        </div>
      </section>

      <section className="sec stage-sec" aria-labelledby="s1">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <span className="temp" style={{ "--t": "#d9452b" } as React.CSSProperties}><b>01</b> 600 °C · Load</span>
              <h2 id="s1">Bring the shader<br />you already have</h2>
            </div>
            <p className="lede">
              Code copied from Shadertoy, a gl-transition, an old GLSL ES effect from your app. Kiln converts it on the way in, and the
              error line numbers still match your file.
            </p>
          </div>
          <div data-reveal><DialectSwap /></div>
        </div>
      </section>

      <section className="sec stage-sec" aria-labelledby="s2">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <span className="temp" style={{ "--t": "#ff8a3d" } as React.CSSProperties}><b>02</b> 900 °C · Shape</span>
              <h2 id="s2">Tune it until<br />it feels right</h2>
            </div>
            <p className="lede">Your numbers become sliders and your footage becomes textures, so you stop editing constants and recompiling.</p>
          </div>
          <StoryTour />
        </div>
      </section>

      <section className="sec stage-sec" aria-labelledby="s3">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <span className="temp" style={{ "--t": "#ffc04d" } as React.CSSProperties}><b>03</b> 1100 °C · Fire</span>
              <h2 id="s3">Prove it runs<br />on a phone</h2>
            </div>
            <p className="lede">
              Desktop drivers forgive things phones don&apos;t. Kiln checks every compile against GLSL ES the way a phone would, and
              converts your shader to Metal for iOS.
            </p>
          </div>
          <div className="pipeline" data-reveal>
            {[
              ["#d9452b", "your code", "GLSL", "Any dialect, exactly as you wrote it."],
              ["#ff8a3d", "glslang", "ES check", "Missing precision and other phone-only errors, on every compile."],
              ["#ffc04d", "SPIR‑V", "Cross-compile", "Your shader is compiled to SPIR‑V once."],
              ["#fff0b8", "SPIRV-Cross", "Metal", "MSL for iOS or macOS, checked with Xcode's metal compiler."],
            ].map(([t, deg, h, p]) => (
              <div key={h} className="stage" style={{ "--t": t } as React.CSSProperties}>
                <span className="deg">{deg}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <figure className="shot-wide" data-reveal>
            <img data-zoom src="/shots/metal.webp" alt="The Mobile / Metal panel: the heat haze effect passes the GLSL ES check and is converted to Metal Shading Language" width={1600} height={1055} loading="lazy" />
            <figcaption>The heat haze effect: &ldquo;Passes GLSL ES 1.00 validation&rdquo;, then Convert to MSL for iOS.</figcaption>
          </figure>
        </div>
      </section>

      <section className="sec stage-sec" aria-labelledby="s4">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <span className="temp" style={{ "--t": "#fff0b8" } as React.CSSProperties}><b>04</b> 1300 °C · Ship</span>
              <h2 id="s4">Take it out<br />of the kiln</h2>
            </div>
            <p className="lede">
              Render exactly what you saw, frame by frame, at any size. Video textures are decoded per frame, so nothing drifts.
            </p>
          </div>
          <div className="ship">
            <figure className="phone" data-reveal>
              <video src="/media/haze.mp4" poster="/media/haze.jpg" autoPlay muted loop playsInline aria-label="The heat haze effect as a 540×960 MP4 exported by Kiln" />
              <figcaption>Exported by Kiln: heat_haze.frag, 540×960 MP4</figcaption>
            </figure>
            <div data-reveal style={{ "--delay": "0.1s" } as React.CSSProperties}>
              <table className="firing">
                <thead>
                  <tr><th>Format</th><th>Good for</th><th className="hide-sm">Details</th></tr>
                </thead>
                <tbody>
                  {FORMATS.map(([f, use, d]) => (
                    <tr key={f}><td>{f}</td><td>{use}</td><td className="dim hide-sm">{d}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="small-note">
                Every export is written to a <code>.part</code> file and renamed only when it&apos;s complete, so a cancelled render never
                leaves a broken file behind.
              </p>
            </div>
          </div>
          <div className="batch" data-reveal>
            <div>
              <h3>A whole folder, overnight</h3>
              <p className="lede" style={{ marginTop: 14 }}>
                Batch render takes every shader in a folder, in any dialect, and renders them one by one. A file that fails is marked and
                skipped. The rest keep going, and Retry failed re-runs just those.
              </p>
            </div>
            <BatchDemo />
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="shelf" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <div>
              <span className="temp" style={{ "--t": "#ff6f9b" } as React.CSSProperties}><b>Out</b> cooling on the shelf</span>
              <h2 id="shelf">Six firings,<br />one editor</h2>
            </div>
            <p className="lede">
              Every clip here was rendered by Kiln&apos;s own exporter, from shaders written for this page. Each one shows a different
              dialect or feature, and the source is one click away.
            </p>
          </div>
          <div data-reveal><Shelf /></div>
        </div>
      </section>

      <section className="sec" aria-labelledby="also" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <h2 id="also">Also in the kiln</h2>
            <p className="lede">
              The rest of the toolbox. <Link className="link-arrow" href="/features">Every feature →</Link>
            </p>
          </div>
          <figure className="shot-wide" data-reveal style={{ margin: "0 0 48px" }}>
            <img data-zoom src="/shots/overlay.webp" alt="Overlay mode: the vase shader's code floating over its full-screen output" width={1600} height={1055} loading="lazy" />
            <figcaption>Overlay mode (F2): the code floats over the full-screen output. Esc goes back.</figcaption>
          </figure>
          <dl className="spec" data-reveal>
            {ALSO.map(([t, d]) => (
              <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="furnace" aria-labelledby="cta">
        <Embers />
        <div className="wrap" style={{ position: "relative" }}>
          <h2 id="cta" data-reveal>Light <span className="hot">the kiln</span>.</h2>
          <div className="row" data-reveal>
            <div>
              <DownloadButton from="footer-cta" />
              <p className="hero-meta">
                Or <Link href="/download" className="link-arrow">see every platform</Link>
              </p>
            </div>
            <div className="keys" aria-label="Shortcuts">
              <span><kbd>F5</kbd> compile</span>
              <span><kbd>F2</kbd> overlay</span>
              <span><kbd>⌘</kbd> <kbd>E</kbd> export</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
