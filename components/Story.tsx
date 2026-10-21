"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- Stage 1: any dialect goes in ---------- */

const DIALECTS = [
  {
    name: "GLSL ES 1.00",
    tag: "varying · texture2D · gl_FragColor",
    note: "Converted to GLSL 410 · mobile ES check passes",
    code: `precision mediump float;
varying vec2 tc;
uniform sampler2D frameTexture;
uniform float u_strength; // @slider 0..1 0.6

void main() {
    vec2 uv = tc;
    float wave = sin(uv.y * 40.0) * 0.004 * u_strength;
    gl_FragColor = texture2D(frameTexture, uv + vec2(wave, 0.0));
}`,
  },
  {
    name: "Shadertoy",
    tag: "mainImage() · iTime · iChannel0",
    note: "Runs as written · iResolution, iMouse, iDate provided",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}`,
  },
  {
    name: "gl-transitions",
    tag: "transition() · progress · getFromColor",
    note: "From / To textures wired up · progress can be scrubbed or keyframed",
    code: `uniform float smoothness; // = 0.5

vec4 transition(vec2 uv) {
    float p = progress * (1.0 + smoothness);
    float m = smoothstep(p - smoothness, p, uv.x);
    return mix(getToColor(uv), getFromColor(uv), m);
}`,
  },
  {
    name: "GLSL 300 es",
    tag: "#version 300 es · out vec4",
    note: "Converted · error line numbers still match your file",
    code: `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_tex0;

void main() {
    vec3 c = texture(u_tex0, v_uv).rgb;
    outColor = vec4(vec3(dot(c, vec3(0.299, 0.587, 0.114))), 1.0);
}`,
  },
  {
    name: "Desktop GLSL",
    tag: "#version 330+ · multipass",
    note: "Runs as written · read u_bufferA–D and u_prev",
    code: `#version 410
uniform sampler2D u_prev;   // this pass, last frame
uniform vec2 u_resolution;
out vec4 color;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    color = texture(u_prev, uv) * 0.97; // feedback trail
}`,
  },
];

export function DialectSwap() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const d = DIALECTS[i];

  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % DIALECTS.length), 5200);
    return () => clearTimeout(t);
  }, [i, auto]);

  return (
    <div className="dialects">
      <ul className="dialect-list" role="list">
        {DIALECTS.map((x, n) => (
          <li key={x.name}>
            <button aria-pressed={n === i} onClick={() => { setI(n); setAuto(false); }} data-track={`dialect:${x.name}`}>
              {x.name}
              <small>{n === i ? "compiled ✓" : x.tag.split(" · ")[0]}</small>
            </button>
          </li>
        ))}
      </ul>
      <div className="dialect-pane">
        <header>
          <span>{d.tag}</span>
          <span>Image pass</span>
        </header>
        <pre key={i} className="swap">{d.code}</pre>
        <div className="progress-line">{auto && <i key={i} style={{ "--dur": "5.2s" } as React.CSSProperties} />}</div>
        <footer>✓ {d.note}</footer>
      </div>
    </div>
  );
}

/* ---------- Stage 2: shape it (sticky screenshot tour) ---------- */

const TOUR = [
  {
    img: "/shots/01-editor.png",
    alt: "Kiln editing a GLSL ES video effect with the iPhone preset, a photo texture and live sliders",
    title: "See it at phone size, while you type",
    body: "Pick the iPhone or Android preset and the preview becomes 1080×1920 with a top-left UV origin, the same as a camera pipeline. Kiln recompiles 120 ms after your last keystroke, and an error never blanks the preview.",
  },
  {
    img: "/shots/02-add-uniform.png",
    alt: "The Add uniform dialog creating a colour control",
    title: "Comments turn into controls",
    body: "Write // @slider 0..1 next to a uniform and you get a slider. @color, @toggle and @drag work the same way. Any control can follow the clock, loop 0..1, or play keyframes with easing on the timeline.",
  },
  {
    img: "/shots/03-shadertoy.png",
    alt: "A Shadertoy shader with three annotated uniforms as sliders and a colour picker",
    title: "Feed it real footage",
    body: "Drop in images, video files, your camera, an audio track or the microphone. Video follows the timeline frame by frame, and audio arrives as a Shadertoy-style spectrum with bass, mid and high levels you can use directly.",
  },
];

export function StoryTour() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <div className="tour">
      <div className="tour-steps">
        {TOUR.map((t, i) => (
          <div key={t.img} className="tour-step" data-i={i} data-active={i === active} ref={(el) => { refs.current[i] = el; }}>
            <span className="n">2.{i + 1}</span>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
            <img className="tour-mobile-img" src={t.img} alt={t.alt} loading="lazy" width={1600} height={960} />
          </div>
        ))}
      </div>
      <div className="tour-frame">
        {TOUR.map((t, i) => (
          <img key={t.img} src={t.img} alt={i === active ? t.alt : ""} data-active={i === active} width={1600} height={960} loading={i ? "lazy" : "eager"} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Stage 4: batch render ---------- */

const FILES = ["ripple.frag", "glitch_rgb.glsl", "burn_in.fs", "vhs_wobble.frag", "film_grain.frag"];
type S = "queued" | "compiling" | "rendering" | "done" | "failed";

export function BatchDemo() {
  const [state, setState] = useState<{ s: S[]; p: number }>({ s: FILES.map(() => "queued"), p: 0 });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState({ s: ["done", "done", "failed", "done", "done"], p: 0 });
      return;
    }
    let cur = 0, tick = 0, on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(root.current!);
    const id = setInterval(() => {
      if (!on) return;
      tick++;
      setState((st) => {
        const s = [...st.s];
        if (cur >= FILES.length) {
          if (tick > 12) { cur = 0; tick = 0; return { s: FILES.map(() => "queued"), p: 0 }; }
          return st;
        }
        if (s[cur] === "queued") { s[cur] = "compiling"; return { s, p: 0 }; }
        if (s[cur] === "compiling") {
          // One file has a typo, to show that a failure doesn't stop the batch.
          if (cur === 2) { s[cur] = "failed"; cur++; tick = 0; return { s, p: 0 }; }
          s[cur] = "rendering"; return { s, p: 0 };
        }
        const p = st.p + 20;
        if (p >= 100) { s[cur] = "done"; cur++; tick = 0; return { s, p: 0 }; }
        return { s, p };
      });
    }, 260);
    return () => { clearInterval(id); io.disconnect(); };
  }, []);

  const label = { queued: "Queued", compiling: "Compiling", rendering: "Rendering", done: "Done", failed: "Failed · line 14: 'vec' undeclared" };
  return (
    <div className="batch-list" ref={root} aria-label="Batch render progress, animated example">
      {FILES.map((f, i) => (
        <div key={f} className="batch-row" data-s={state.s[i]}>
          <span>{f}</span>
          <span className="st">{label[state.s[i]]}</span>
          {state.s[i] === "rendering" && <i className="pbar" style={{ "--p": `${state.p}%` } as React.CSSProperties} />}
        </div>
      ))}
    </div>
  );
}
