import "server-only";
import { db } from "./supabase";

export type Row = {
  created_at: string;
  type: "pageview" | "click" | "download" | "engage";
  path: string;
  label: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  visitor: string;
  duration_ms: number | null;
};

const COLS = "created_at,type,path,label,referrer,utm_source,utm_campaign,country,city,device,os,browser,visitor,duration_ms";
const PAGE = 1000; // Supabase's default max rows per request
const MAX = 200_000;

async function fetchRange(from: Date, to: Date): Promise<Row[]> {
  const client = db();
  if (!client) return [];
  const out: Row[] = [];
  for (let off = 0; off < MAX; off += PAGE) {
    const { data, error } = await client
      .from("events")
      .select(COLS)
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .range(off, off + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const dayKey = (iso: string) => iso.slice(0, 10);

function top(rows: Row[], key: (r: Row) => string | null | undefined, n = 8) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));
}

function summary(rows: Row[]) {
  const views = rows.filter((r) => r.type === "pageview");
  const downloads = rows.filter((r) => r.type === "download");
  const engage = rows.filter((r) => r.type === "engage" && r.duration_ms);
  // Visitor hashes rotate daily, so a visitor is one person on one day.
  const visitors = new Set(views.map((r) => `${dayKey(r.created_at)}|${r.visitor}`)).size;
  const downloaders = new Set(downloads.map((r) => `${dayKey(r.created_at)}|${r.visitor}`)).size;
  const avgMs = engage.length ? engage.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / engage.length : 0;
  return {
    views: views.length,
    visitors,
    downloads: downloads.length,
    clicks: rows.filter((r) => r.type === "click").length,
    rate: visitors ? downloaders / visitors : 0,
    avgMs,
  };
}

export async function loadStats(days: number) {
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);
  const [rows, prev] = await Promise.all([fetchRange(from, now), fetchRange(prevFrom, from)]);

  const views = rows.filter((r) => r.type === "pageview");
  const downloads = rows.filter((r) => r.type === "download");

  const series: { day: string; visitors: number; views: number; downloads: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    series.push({ day: dayKey(new Date(now.getTime() - i * 86_400_000).toISOString()), visitors: 0, views: 0, downloads: 0 });
  }
  const idx = new Map(series.map((s, i) => [s.day, i]));
  const seen = new Set<string>();
  for (const r of views) {
    const i = idx.get(dayKey(r.created_at));
    if (i === undefined) continue;
    series[i].views++;
    const k = `${series[i].day}|${r.visitor}`;
    if (!seen.has(k)) { seen.add(k); series[i].visitors++; }
  }
  for (const r of downloads) {
    const i = idx.get(dayKey(r.created_at));
    if (i !== undefined) series[i].downloads++;
  }

  return {
    configured: db() !== null,
    total: rows.length,
    now: summary(rows),
    prev: summary(prev),
    series,
    platforms: top(downloads, (r) => r.label, 6),
    downloadSources: top(downloads, (r) => r.path),
    pages: top(views, (r) => r.path),
    referrers: top(views, (r) => r.referrer),
    campaigns: top(views, (r) => (r.utm_source ? `${r.utm_source}${r.utm_campaign ? ` / ${r.utm_campaign}` : ""}` : null)),
    clicks: top(rows.filter((r) => r.type === "click"), (r) => r.label, 12),
    countries: top(views, (r) => r.country),
    cities: top(views, (r) => (r.city ? `${r.city}${r.country ? `, ${r.country}` : ""}` : null)),
    os: top(views, (r) => r.os),
    browsers: top(views, (r) => r.browser),
    devices: top(views, (r) => r.device),
    recent: rows.filter((r) => r.type !== "engage").slice(0, 40),
  };
}

export type Stats = Awaited<ReturnType<typeof loadStats>>;
