"use client";

import { useState } from "react";

type Point = { day: string; value: number };

const W = 720;
const H = 220;
const PAD = { l: 36, r: 12, t: 14, b: 26 };

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

function Axes({ max, n }: { max: number; n: number }) {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.t + ih - (t / max) * ih;
        return (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--line-soft)" />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="ax">{t}</text>
          </g>
        );
      })}
      <text x={PAD.l} y={H - 6} className="ax">{n} days ago</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" className="ax">today</text>
    </g>
  );
}

/** Single-series area chart with a crosshair tooltip. */
export function AreaChart({ data, label }: { data: Point[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${PAD.t + ih}L${x(0)},${PAD.t + ih}Z`;

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} per day`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.l) / iw) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8a3d" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Axes max={max} n={data.length} />
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
          <b>{data[hover].value}</b> {label.toLowerCase()} · {fmtDay(data[hover].day)}
        </div>
      )}
    </div>
  );
}

/** Single-series column chart with a per-bar tooltip. */
export function ColumnChart({ data, label }: { data: Point[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / data.length;
  const bw = Math.max(2, slot - 2); // 2px gap between bars

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} per day`} onMouseLeave={() => setHover(null)}>
        <Axes max={max} n={data.length} />
        {data.map((d, i) => {
          const h = (d.value / max) * ih;
          const bx = PAD.l + i * slot + 1;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={ih} fill="transparent" />
              {d.value > 0 && (
                <path
                  d={`M${bx},${PAD.t + ih}V${PAD.t + ih - h + Math.min(3, h)}q0,-${Math.min(3, h)} ${Math.min(3, bw / 2)},-${Math.min(3, h)}H${bx + bw - Math.min(3, bw / 2)}q${Math.min(3, bw / 2)},0 ${Math.min(3, bw / 2)},${Math.min(3, h)}V${PAD.t + ih}Z`}
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
          <b>{data[hover].value}</b> {label.toLowerCase()} · {fmtDay(data[hover].day)}
        </div>
      )}
    </div>
  );
}
