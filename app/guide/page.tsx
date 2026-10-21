import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guide",
  description: "Get started with Kiln: your first effect, uniform controls, built-in uniforms, multipass, transitions, export and shortcuts.",
  alternates: { canonical: "/guide" },
};

const TOC = [
  ["start", "First effect"],
  ["controls", "Uniform controls"],
  ["builtins", "Built-in uniforms"],
  ["textures", "Textures and audio"],
  ["multipass", "Multipass"],
  ["transitions", "Transitions"],
  ["export", "Export"],
  ["shortcuts", "Shortcuts"],
  ["headless", "Headless and CI"],
];

export default function Guide() {
  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <span className="temp"><b>Guide</b> ten minutes</span>
          <h1>From blank<br />to <span className="hot">glowing</span></h1>
          <p className="lede">The short version of the README: enough to make, tune and export your first effect.</p>
        </div>
      </header>
      <div className="wrap doc-layout">
        <nav className="toc" aria-label="On this page">
          {TOC.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
        </nav>
        <article className="prose">
          <h2 id="start" style={{ marginTop: 0 }}>First effect</h2>
          <p>Open Kiln and choose <strong>File → New from template → Video effect (GLSL ES)</strong>. Set the device preset to iPhone in the top bar. The preview is now 1080×1920 with a top-left UV origin, like a camera frame.</p>
          <p>Drag an image or video onto the Textures panel. It becomes <code>u_tex0</code> (or <code>iChannel0</code>). Start typing: Kiln recompiles shortly after you stop, and errors appear in the Console with line numbers that match your file.</p>

          <h2 id="controls">Uniform controls</h2>
          <p>A comment after a uniform turns it into a control in the Uniforms panel:</p>
          <pre className="shell">{`uniform float u_strength; // @slider 0..1 0.6
uniform vec3  u_tint;     // @color #FF994D
uniform bool  u_mirror;   // @toggle
uniform vec2  u_offset;   // @drag`}</pre>
          <p>gl-transitions style <code>{"// = 0.5"}</code> defaults work too. Each uniform has a mode: <strong>Manual</strong>, <strong>Time</strong>, <strong>Loop 0..1</strong>, <strong>Keyframes</strong> or <strong>Video position</strong>. Uniforms → <strong>+ Add uniform</strong> writes the declaration and comment for you.</p>
          <p>For uber-shaders, every <code>#ifndef NAME</code> / <code>#define NAME value</code> pair appears at the top of the panel. Changing it recompiles at once, and variants you&apos;ve already compiled come back instantly.</p>

          <h2 id="builtins">Built-in uniforms</h2>
          <table>
            <thead><tr><th>Kiln</th><th>Shadertoy</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td><code>u_time</code></td><td><code>iTime</code></td><td>Seconds on the timeline</td></tr>
              <tr><td><code>u_timeDelta</code></td><td><code>iTimeDelta</code></td><td>Seconds since the last frame</td></tr>
              <tr><td><code>u_frame</code></td><td><code>iFrame</code></td><td>Frame number</td></tr>
              <tr><td><code>u_resolution</code></td><td><code>iResolution</code></td><td>Output size in pixels</td></tr>
              <tr><td><code>u_mouse</code></td><td><code>iMouse</code></td><td>Mouse position over the preview</td></tr>
              <tr><td><code>u_audioLevel</code>, <code>u_bass</code>, <code>u_mid</code>, <code>u_high</code></td><td></td><td>Audio levels from the first audio texture</td></tr>
              <tr><td><code>ratio</code></td><td></td><td>Aspect ratio, for transitions</td></tr>
            </tbody>
          </table>

          <h2 id="textures">Textures and audio</h2>
          <p>Add images, video files, the camera, an audio file, the microphone, noise or a checker. Slot <em>i</em> is <code>u_tex&lt;i&gt;</code> or <code>iChannel&lt;i&gt;</code>; other sampler names take slots in the order they&apos;re declared. Video textures follow the timeline, and exports decode them frame by frame.</p>
          <p>Audio textures are 512×2: row 0 is the spectrum, row 1 the waveform, the same layout as Shadertoy. Tick <strong>Hear it</strong> to play the file while you preview.</p>

          <h2 id="multipass">Multipass</h2>
          <p>Add up to four buffer passes (Buffer A–D, 16-bit float) next to the Image pass. Read another pass with <code>u_bufferA</code>…<code>u_bufferD</code>, and this pass&apos;s previous frame with <code>u_prev</code>, for trails and feedback. The iChannels… button points <code>iChannel0..3</code> at any texture or buffer.</p>

          <h2 id="transitions">Transitions</h2>
          <p>Pick the From and To textures in the Transition panel. They&apos;re available as <code>u_from</code> / <code>u_to</code> or through <code>getFromColor()</code> / <code>getToColor()</code>. Scrub, play or keyframe <code>progress</code>.</p>

          <h2 id="export">Export</h2>
          <p>Export (<kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>E</kbd>) writes a PNG frame or sequence, MP4, MOV (ProRes 422 HQ), GIF or WebP at any size, fps and length. Each format has a one-click recommendation, such as GIF at 15 fps and 720 px wide. Video formats need ffmpeg; if it&apos;s missing, the Export window offers to install it.</p>
          <p><strong>Export → Batch…</strong> renders every shader in a folder into <code>renders/</code>, skipping files that already have a render unless you tick Overwrite.</p>

          <h2 id="shortcuts">Shortcuts</h2>
          <table>
            <thead><tr><th>Keys</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><kbd>F5</kbd> / <kbd>Shift</kbd> <kbd>F5</kbd></td><td>Compile this pass / all passes</td></tr>
              <tr><td><kbd>⌘</kbd> <kbd>S</kbd> / <kbd>⌘</kbd> <kbd>Shift</kbd> <kbd>S</kbd></td><td>Save / Save As</td></tr>
              <tr><td><kbd>⌘</kbd> <kbd>O</kbd></td><td>Open project</td></tr>
              <tr><td><kbd>⌘</kbd> <kbd>E</kbd></td><td>Export</td></tr>
              <tr><td><kbd>F2</kbd>, <kbd>Esc</kbd></td><td>Overlay mode on / off</td></tr>
              <tr><td><kbd>Ctrl</kbd> <kbd>Space</kbd></td><td>Autocomplete</td></tr>
            </tbody>
          </table>
          <p>On Windows and Linux, use <kbd>Ctrl</kbd> where you see <kbd>⌘</kbd>.</p>

          <h2 id="headless">Headless and CI</h2>
          <pre className="shell">{`KILN_EXPORT=out.mp4 ./Kiln effect.frag      # render 2 s at 540×960
KILN_BATCH=shaders/ ./Kiln                   # render a folder, exit 1 on failure
KILN_BATCH_FORMAT=webp KILN_BATCH=shaders/ ./Kiln`}</pre>
          <p>Batch runs don&apos;t touch your settings or autosave. For everything else, see the <a href="https://github.com/muhammadhassan2/Kiln#readme">README on GitHub</a>, or go back to the <Link href="/download">download page</Link>.</p>
        </article>
      </div>
    </>
  );
}
