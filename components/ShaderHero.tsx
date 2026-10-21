"use client";

import { useEffect, useRef, useState } from "react";

// examples/molten.frag from the Kiln repo, exactly as it ships.
const SOURCE = `// Molten glass: domain-warped fbm, coloured like a kiln at full heat.
uniform float u_heat;   // @slider 0..2 1.2
uniform vec3  u_glow;   // @color #FF8A3D
uniform float u_warp;   // @slider 0..3 1.6

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime * 0.25;
    vec2 q = vec2(fbm(uv * 2.0 + t), fbm(uv * 2.0 - t + 4.0));
    vec2 r = vec2(fbm(uv * 2.0 + u_warp * q + vec2(1.7, 9.2) + t * 1.5), fbm(uv * 2.0 + u_warp * q + vec2(8.3, 2.8) - t));
    float f = fbm(uv * 2.0 + u_warp * r);
    vec3 col = mix(vec3(0.06, 0.02, 0.10), vec3(0.55, 0.08, 0.35), clamp(f * f * 2.5, 0.0, 1.0));
    col = mix(col, u_glow, clamp(length(q) * 0.9, 0.0, 1.0));
    col = mix(col, vec3(1.0, 0.92, 0.6), clamp(pow(r.x, 3.0) * u_heat, 0.0, 1.0));
    col *= 0.6 + 0.9 * f;
    col *= 1.0 - 0.35 * dot(uv, uv);
    fragColor = vec4(pow(col, vec3(2.2)) * 1.9, 1.0);
}`;

// What Kiln does for a Shadertoy-style shader: add the built-ins and a main() that calls mainImage().
const FRAG = `precision highp float;
uniform vec3 iResolution;
uniform float iTime;
${SOURCE}
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }`;

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const KEYWORDS = /^(uniform|void|for|return|in|out|precision|highp)$/;
const TYPES = /^(float|int|vec2|vec3|vec4)$/;
const BUILTINS = /^(fract|sin|dot|floor|mix|clamp|length|pow)$/;

function highlight(line: string) {
  const parts: React.ReactNode[] = [];
  const ci = line.indexOf("//");
  const code = ci >= 0 ? line.slice(0, ci) : line;
  code.split(/(\b[\w.]+\b)/).forEach((tok, i) => {
    if (!tok) return;
    const cls = KEYWORDS.test(tok) ? "tk-k"
      : TYPES.test(tok) ? "tk-t"
      : /^\d/.test(tok) ? "tk-n"
      : /^(u_|i[A-Z])/.test(tok) ? "tk-u"
      : BUILTINS.test(tok) ? "tk-f" : null;
    parts.push(cls ? <span key={i} className={cls}>{tok}</span> : tok);
  });
  if (ci >= 0) parts.push(<span key="c" className="tk-c">{line.slice(ci)}</span>);
  return parts;
}

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function ShaderHero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const vals = useRef({ heat: 1.2, warp: 1.6, glow: "#ff8a3d" });
  const [ui, setUi] = useState(vals.current);
  const [live, setLive] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState("");

  const set = (k: "heat" | "warp" | "glow", v: number | string, line: number) => {
    vals.current = { ...vals.current, [k]: v };
    setUi(vals.current);
    setLive(line);
  };

  useEffect(() => {
    const c = canvas.current!;
    const gl = c.getContext("webgl", { antialias: false, powerPreference: "low-power" });
    if (!gl) return setFailed(true);

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return setFailed(true);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("iResolution"), uTime = U("iTime"), uHeat = U("u_heat"), uWarp = U("u_warp"), uGlow = U("u_glow");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const t0 = performance.now() - 8000;

    const resize = () => {
      const s = Math.min(devicePixelRatio, 1.5) * 0.75; // fbm is soft, so a lower resolution costs nothing visually
      c.width = Math.max(1, Math.round(c.clientWidth * s));
      c.height = Math.max(1, Math.round(c.clientHeight * s));
      gl.viewport(0, 0, c.width, c.height);
    };
    const draw = (now: number) => {
      const v = vals.current;
      gl.uniform3f(uRes, c.width, c.height, 1);
      gl.uniform1f(uTime, reduce ? 8 : (now - t0) / 1000);
      gl.uniform1f(uHeat, v.heat);
      gl.uniform1f(uWarp, v.warp);
      gl.uniform3fv(uGlow, hexToRgb(v.glow));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = 0;
      draw(now);
      frames++;
      if (now - last > 1000) {
        setStats(`${c.width}×${c.height} · ${Math.round((frames * 1000) / (now - last))} fps`);
        frames = 0;
        last = now;
      }
      if (visible && !reduce && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    resize();
    kick();
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(c);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);
    // With reduced motion there is no loop, so redraw when a control changes.
    const onInput = () => reduce && kick();
    c.parentElement?.parentElement?.addEventListener("input", onInput);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      c.parentElement?.parentElement?.removeEventListener("input", onInput);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useEffect(() => {
    if (live === null) return;
    const t = setTimeout(() => setLive(null), 900);
    return () => clearTimeout(t);
  }, [live, ui]);

  const lines = SOURCE.split("\n");

  return (
    <div className="studio" role="figure" aria-label="Kiln running its molten glass example shader. The sliders change it live.">
      <div className="studio-bar">
        <span className="tab kiln">Kiln</span>
        <span className="tab hide-sm">File</span>
        <span className="tab hide-sm">Pass</span>
        <span className="tab hide-sm">Shader</span>
        <span className="tab">molten.frag</span>
        <span className="fps hide-sm">{stats.split(" · ")[1] ?? ""}</span>
        <span className="compile">Compile</span>
      </div>
      <div className="studio-body">
        <pre className="code" aria-hidden>
          {lines.map((l, i) => (
            <span key={i} className={`l${live === i ? " live" : ""}`}>{highlight(l)}{"\n"}</span>
          ))}
        </pre>
        <div className="preview">
          {failed ? (
            <img src="/shots/03-shadertoy.png" alt="" style={{ objectFit: "cover", flex: 1 }} />
          ) : (
            <canvas ref={canvas} />
          )}
          <span className="preview-tag">Image{stats ? ` · ${stats.split(" · ")[0]}` : ""}</span>
          <div className="uniforms">
            <div className="uni">
              <input id="u-heat" type="range" min={0} max={2} step={0.01} value={ui.heat} onChange={(e) => set("heat", +e.target.value, 1)} data-track="hero:slider-heat" />
              <output htmlFor="u-heat">{ui.heat.toFixed(2)}</output>
              <label htmlFor="u-heat">u_heat</label>
            </div>
            <div className="uni">
              <input id="u-warp" type="range" min={0} max={3} step={0.01} value={ui.warp} onChange={(e) => set("warp", +e.target.value, 3)} data-track="hero:slider-warp" />
              <output htmlFor="u-warp">{ui.warp.toFixed(2)}</output>
              <label htmlFor="u-warp">u_warp</label>
            </div>
            <div className="uni">
              <input id="u-glow" type="color" value={ui.glow} onChange={(e) => set("glow", e.target.value, 2)} data-track="hero:color" />
              <output htmlFor="u-glow">{ui.glow.toUpperCase()}</output>
              <label htmlFor="u-glow">u_glow</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
