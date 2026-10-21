import type { Metadata } from "next";
import { DetectedNote, DownloadButton, PlatformCards } from "@/components/Download";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Download",
  description: "Download Kiln, the live shader editor, for Windows or macOS, or build it from source on Linux. Free and open source.",
  alternates: { canonical: "/download" },
};

const FAQ = [
  ["Is Kiln free?", "Yes. Kiln is free and its source is on GitHub. There's no account, licence key or trial."],
  ["Does it need the internet?", "No. Everything runs on your machine. Only the optional AI assistant talks to the Claude API, using your own API key."],
  ["Do I need ffmpeg?", "Only for video, camera and audio textures and for MP4, MOV, GIF and WebP export. If Kiln can't find a suitable copy, the Export window offers an Install ffmpeg button (winget on Windows, Homebrew on macOS, your package manager on Linux)."],
  ["Why does my system warn me the first time I open it?", "The builds aren't signed with a paid Apple or Microsoft certificate yet. On macOS, right-click Kiln and choose Open once. On Windows, click More info, then Run anyway. After that it opens normally."],
  ["Will it run on my laptop's GPU?", "Kiln needs OpenGL 4.1, which every Mac since 2012 and almost every Windows GPU from the last ten years supports, integrated graphics included."],
  ["Where are my settings and projects?", "Settings and the autosaved session live in %APPDATA%\\Kiln on Windows and ~/Library/Application Support/Kiln on macOS. The project library is in Documents/Kiln/Library."],
];

export default function DownloadPage() {
  return (
    <>
      <section className="dl-hero">
        <div className="wrap dl-main">
          <div>
            <span className="temp"><b>v1.0</b> Free · open source</span>
            <h1>Download<br /><span className="hot">Kiln</span></h1>
            <p className="lede" style={{ marginTop: 22 }}>
              One download, no account, no installer wizard. Open it and you have a shader running in the preview.
            </p>
            <div className="dl-detected"><DownloadButton from="download-hero" /></div>
            <DetectedNote />
            <LeadForm from="/download" />
          </div>
          <img className="dl-icon" src="/app-icon.png" alt="The Kiln app icon: a brick kiln glowing from inside" width={1024} height={1024} />
        </div>
        <div className="wrap"><PlatformCards /></div>
      </section>

      <section className="sec" aria-labelledby="after">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="after">The first<br />five minutes</h2>
            <p className="lede">What happens after you click download, so nothing surprises you.</p>
          </div>
          <div className="two">
            <div>
              <h3 style={{ marginBottom: 8 }}>On Windows</h3>
              <ol className="steps">
                <li><div><strong>Unzip Kiln-win64.zip</strong><p>Anywhere you like. It&apos;s portable, so it doesn&apos;t touch the registry.</p></div></li>
                <li><div><strong>Open Kiln.exe</strong><p>If SmartScreen appears, click More info, then Run anyway. It&apos;s only asked once.</p></div></li>
                <li><div><strong>Pick a template</strong><p>File → New from template. Try Video effect with the iPhone preset.</p></div></li>
                <li><div><strong>Install ffmpeg when you need it</strong><p>Export → Install ffmpeg runs winget for you. Kiln picks it up without restarting.</p></div></li>
              </ol>
            </div>
            <div>
              <h3 style={{ marginBottom: 8 }}>On macOS</h3>
              <ol className="steps">
                <li><div><strong>Open Kiln.dmg</strong><p>Drag Kiln into Applications.</p></div></li>
                <li><div><strong>Right-click → Open, once</strong><p>The app isn&apos;t notarized yet, so macOS asks the first time.</p></div></li>
                <li><div><strong>Allow camera and microphone</strong><p>Only if you add those textures. macOS asks like it does for any app.</p></div></li>
                <li><div><strong>Double-click .kiln files</strong><p>Projects open straight from Finder. .frag and .glsl files appear under Open With.</p></div></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="src" style={{ paddingTop: 0 }}>
        <div className="wrap two">
          <div>
            <span className="temp"><b>Linux</b> and everyone else</span>
            <h2 id="src">Build it<br />yourself</h2>
            <p className="lede" style={{ marginTop: 18 }}>
              CMake fetches every dependency at a pinned version, so a clean machine needs only a compiler, CMake and OpenGL headers.
            </p>
          </div>
          <div>
            <pre className="shell">
              <span className="p">$ </span>git clone {site.repo}{"\n"}
              <span className="p">$ </span>cd Kiln{"\n"}
              <span className="p">$ </span>cmake -S . -B build -DCMAKE_BUILD_TYPE=Release{"\n"}
              <span className="p">$ </span>cmake --build build -j{"\n"}
              <span className="p">$ </span>./build/Kiln --preset iphone
            </pre>
            <p className="dl-note">
              The first configure downloads GLFW, Dear ImGui, glslang, SPIRV-Cross and a few others, which takes a few minutes.
            </p>
          </div>
        </div>
      </section>

      <section className="sec faq" aria-labelledby="faq" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2 id="faq" style={{ marginBottom: 32 }}>Questions</h2>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary data-track={`faq:${q.slice(0, 40)}`}>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
