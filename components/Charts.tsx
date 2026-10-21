"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Point = { label: string; value: number };

const W = 720;
const H = 220;
const PAD = { l: 36, r: 12, t: 14, b: 26 };

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

function Axes({ max, first, last }: { max: number; first: string; last: string }) {
  const ih = H - PAD.t - PAD.b;
  return (
    <g>
      {[0, 0.5, 1].map((f) => {
        const t = Math.round(max * f);
        const y = PAD.t + ih - (t / max) * ih;
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--line-soft)" />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="ax">{t}</text>
          </g>
        );
      })}
      <text x={PAD.l} y={H - 6} className="ax">{first}</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" className="ax">{last}</text>
    </g>
  );
}

/** Single-series area chart with a crosshair tooltip. */
export function AreaChart({ data, unit }: { data: Point[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${PAD.t + ih}L${x(0)},${PAD.t + ih}Z`;
  if (!data.length) return null;

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${unit} over time`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - PAD.l) / iw) * (data.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8a3d" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Axes max={max} first={data[0].label} last={data[data.length - 1].label} />
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="#ff8a3d" strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--muted)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill="#ff8a3d" stroke="var(--soot-2)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{data[hover].value}</b> {unit} · {data[hover].label}
        </div>
      )}
    </div>
  );
}

/** Single-series column chart with a per-bar tooltip. */
export function ColumnChart({ data, unit }: { data: Point[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / Math.max(data.length, 1);
  const bw = Math.max(2, slot - 2); // 2px gap between bars
  if (!data.length) return null;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} over time`} onMouseLeave={() => setHover(null)}>
        <Axes max={max} first={data[0].label} last={data[data.length - 1].label} />
        {data.map((d, i) => {
          const h = (d.value / max) * ih;
          const bx = PAD.l + i * slot + 1;
          const r = Math.min(3, h, bw / 2);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={ih} fill="transparent" />
              {d.value > 0 && (
                <path
                  d={`M${bx},${PAD.t + ih}V${PAD.t + ih - h + r}q0,-${r} ${r},-${r}H${bx + bw - r}q${r},0 ${r},${r}V${PAD.t + ih}Z`}
                  fill="#ffc04d"
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${((PAD.l + (hover + 0.5) * slot) / W) * 100}%` }}>
          <b>{data[hover].value}</b> {unit} · {data[hover].label}
        </div>
      )}
    </div>
  );
}

/** Sessions by weekday x hour. One hue, darker = fewer: a sequential scale, never a rainbow. */
export function Heatmap({ grid, days }: { grid: number[][]; days: string[] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(...grid.flat(), 1);
  // Ember ramp from the panel surface up to flame; the empty cell stays visibly distinct from 1.
  const color = (v: number) => {
    if (!v) return "var(--clay)";
    const t = 0.2 + 0.8 * (v / max);
    return `color-mix(in oklab, #ffc04d ${Math.round(t * 100)}%, #3a1a1a)`;
  };
  return (
    <div className="heat" onMouseLeave={() => setHover(null)}>
      <div className="heat-grid" role="table" aria-label="Sessions by weekday and hour">
        {grid.map((row, d) => (
          <div key={days[d]} className="heat-row" role="row">
            <span className="heat-day" role="rowheader">{days[d]}</span>
            {row.map((v, h) => (
              <span
                key={h}
                role="cell"
                aria-label={`${days[d]} ${h}:00, ${v} sessions`}
                className="heat-cell"
                style={{ background: color(v), outline: hover?.d === d && hover.h === h ? "2px solid var(--bone)" : undefined }}
                onMouseEnter={() => setHover({ d, h })}
              />
            ))}
          </div>
        ))}
        <div className="heat-row heat-hours" aria-hidden>
          <span className="heat-day" />
          {Array.from({ length: 24 }, (_, h) => <span key={h}>{String(h).padStart(2, "0")}</span>)}
        </div>
      </div>
      <p className="heat-read">
        {hover ? <><b>{grid[hover.d][hover.h]}</b> sessions · {days[hover.d]} {String(hover.h).padStart(2, "0")}:00</> : "Hover a cell"}
        <span className="heat-legend" aria-hidden><i style={{ background: "var(--clay)" }} />0<i style={{ background: color(max * 0.3) }} /><i style={{ background: color(max) }} />{max}</span>
      </p>
    </div>
  );
}

/** Stores the viewer's timezone in a cookie so the server buckets days and hours in it. */
export function TimezoneSync({ current }: { current: string }) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== current) {
      document.cookie = `kiln_tz=${encodeURIComponent(tz)}; path=/admin; max-age=31536000; samesite=strict`;
      location.reload();
    }
  }, [current]);
  return null;
}

/** Marks this browser so the public site stops counting it (the admin's own visits skew small numbers). */
export function ExcludeMe() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      if (localStorage.getItem("kiln_ignore") === null) localStorage.setItem("kiln_ignore", "1");
      setOn(localStorage.getItem("kiln_ignore") === "1");
    } catch {
      setOn(false);
    }
  }, []);
  if (on === null) return null;
  return (
    <label className="exclude">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          try { localStorage.setItem("kiln_ignore", e.target.checked ? "1" : "0"); } catch {}
          setOn(e.target.checked);
        }}
      />
      Don&apos;t count my visits from this browser
    </label>
  );
}

/** Re-fetches the dashboard every 30 s while the tab is visible, so numbers and "active now" stay current. */
export function LiveRefresh({ renderedAt }: { renderedAt: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    try { setLive(localStorage.getItem("kiln_live") !== "0"); } catch {}
  }, []);
  useEffect(() => {
    const tick = setInterval(() => setAgo(Math.max(0, Math.round((Date.now() - renderedAt) / 1000))), 1000);
    return () => clearInterval(tick);
  }, [renderedAt]);
  useEffect(() => {
    if (!live) return;
    const refresh = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", refresh); };
  }, [live, router]);

  return (
    <button
      type="button"
      className={`livebtn${live ? " on" : ""}`}
      onClick={() => {
        const next = !live;
        setLive(next);
        try { localStorage.setItem("kiln_live", next ? "1" : "0"); } catch {}
        if (next) router.refresh();
      }}
      title={live ? "Refreshing every 30 s. Click to pause." : "Paused. Click to refresh every 30 s."}
    >
      {live ? "Live" : "Paused"} · updated {ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}m`} ago
    </button>
  );
}
