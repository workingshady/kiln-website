import "server-only";
import { db } from "./supabase";

/* Definitions (kept in one place so the dashboard can show them):
 * - Visitor: one browser. Rows carry an anonymous id stored in the browser ("device"), so a person
 *   who comes back on another day is the same visitor. Where storage is blocked the server falls back
 *   to a salted IP + browser hash that rotates daily ("daily"); those can be double-counted across days.
 * - Session: a visitor's events with no gap longer than 30 minutes (GA4's default). Sessions continue
 *   across midnight and across tabs.
 * - Engaged session: lasted 10 s or more, OR had 2+ page views, OR downloaded, OR left an email (GA4).
 * - Bounce rate: 1 - engagement rate (GA4).
 * - Conversion: a visitor who downloaded at least once. Lead: an email left on the release form.
 */
export const SESSION_GAP_MS = 30 * 60 * 1000;
const ENGAGED_MS = 10_000;

export type Row = {
  created_at: string;
  type: "pageview" | "click" | "download" | "engage";
  path: string;
  label: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium?: string | null;
  utm_campaign: string | null;
  country: string | null;
  city: string | null;
  region?: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  lang?: string | null;
  visitor: string;
  duration_ms: number | null;
  id_kind?: string | null;
  is_new?: boolean | null;
};

type Lead = { created_at: string; email: string; platform: string | null; path: string | null; visitor: string | null; country: string | null; utm_source: string | null; utm_campaign: string | null };

export type Session = {
  visitor: string;
  start: number;
  end: number;
  landing: string;
  source: string;
  campaign: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  lang: string | null;
  pages: string[];
  downloads: string[];
  clicks: string[];
  engagedMs: number;
  durationMs: number;
  engaged: boolean;
  lead: boolean;
  firstVisit: boolean;
  kind: "device" | "daily";
};

export const RANGES = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangeKey = keyof typeof RANGES;
export const FILTER_KEYS = ["source", "page", "country", "device", "os", "browser", "visitor"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Partial<Record<FilterKey, string>>;

const PAGE = 1000; // Supabase's default max rows per request
const MAX = 300_000;

async function fetchEvents(from: Date): Promise<Row[]> {
  const client = db();
  if (!client) return [];
  const out: Row[] = [];
  for (let off = 0; off < MAX; off += PAGE) {
    // No upper time bound, so rows are never lost to clock skew between server and database.
    const { data, error } = await client.from("events").select("*").gte("created_at", from.toISOString())
      .order("created_at", { ascending: true }).range(off, off + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function fetchLeads(from: Date): Promise<{ rows: Lead[]; ready: boolean }> {
  const client = db();
  if (!client) return { rows: [], ready: false };
  const { data, error } = await client.from("leads").select("created_at,email,platform,path,visitor,country,utm_source,utm_campaign")
    .gte("created_at", from.toISOString()).order("created_at", { ascending: false }).limit(5000);
  if (error) return { rows: [], ready: false }; // table not created yet (migration 002)
  return { rows: data as Lead[], ready: true };
}

/** Rebuild sessions from raw events: per visitor, split wherever 30 minutes pass without activity. */
export function sessionize(rows: Row[]): Session[] {
  const byVisitor = new Map<string, Row[]>();
  for (const r of rows) {
    const list = byVisitor.get(r.visitor);
    if (list) list.push(r);
    else byVisitor.set(r.visitor, [r]);
  }
  const out: Session[] = [];
  for (const [visitor, list] of byVisitor) {
    let cur: Row[] = [];
    const close = () => {
      if (!cur.length) return;
      const views = cur.filter((r) => r.type === "pageview");
      const head = views[0] ?? cur[0];
      const start = Date.parse(cur[0].created_at);
      const end = Date.parse(cur[cur.length - 1].created_at);
      const engagedMs = cur.reduce((s, r) => s + (r.type === "engage" ? r.duration_ms ?? 0 : 0), 0);
      const downloads = cur.filter((r) => r.type === "download").map((r) => r.label ?? "?");
      const clicks = cur.filter((r) => r.type === "click").map((r) => r.label ?? "?");
      const leadLeft = clicks.some((c) => c.startsWith("lead:"));
      const durationMs = Math.min(Math.max(engagedMs, end - start), 4 * 3_600_000);
      out.push({
        visitor,
        start,
        end,
        landing: head.path,
        // A resumed visit with no referrer is Direct, as in GA4.
        source: head.utm_source ? head.utm_source.toLowerCase() : head.referrer && head.referrer !== "Direct" ? head.referrer : "Direct",
        campaign: head.utm_campaign,
        country: head.country,
        city: head.city,
        device: head.device,
        os: head.os,
        browser: head.browser,
        lang: head.lang ?? null,
        pages: views.map((r) => r.path),
        downloads,
        clicks,
        engagedMs,
        durationMs,
        engaged: durationMs >= ENGAGED_MS || views.length >= 2 || downloads.length > 0 || leadLeft,
        lead: leadLeft,
        firstVisit: cur.some((r) => r.is_new === true),
        kind: cur.some((r) => r.id_kind === "device") ? "device" : "daily",
      });
      cur = [];
    };
    for (const r of list) {
      if (cur.length && Date.parse(r.created_at) - Date.parse(cur[cur.length - 1].created_at) > SESSION_GAP_MS) close();
      cur.push(r);
    }
    close();
  }
  return out.sort((a, b) => b.start - a.start);
}

function matches(s: Session, f: Filters) {
  if (f.source && s.source !== f.source) return false;
  if (f.page && !s.pages.includes(f.page) && s.landing !== f.page) return false;
  if (f.country && s.country !== f.country) return false;
  if (f.device && s.device !== f.device) return false;
  if (f.os && s.os !== f.os) return false;
  if (f.browser && s.browser !== f.browser) return false;
  if (f.visitor && s.visitor !== f.visitor) return false;
  return true;
}

function kpis(sessions: Session[], leads: Lead[], earlierVisitors: Set<string>) {
  const visitors = new Set(sessions.map((s) => s.visitor));
  const isNew = new Set(sessions.filter((s) => s.firstVisit).map((s) => s.visitor));
  const kindOf = new Map(sessions.map((s) => [s.visitor, s.kind]));
  // Returning: seen before this period, or a browser id that wasn't flagged as a first visit.
  let returning = 0;
  for (const v of visitors) {
    if (isNew.has(v)) continue;
    if (earlierVisitors.has(v) || kindOf.get(v) === "device") returning++;
  }
  const downloaders = new Set(sessions.filter((s) => s.downloads.length).map((s) => s.visitor));
  const engaged = sessions.filter((s) => s.engaged).length;
  const views = sessions.reduce((n, s) => n + s.pages.length, 0);
  const n = sessions.length || 1;
  return {
    visitors: visitors.size,
    newVisitors: isNew.size,
    returning,
    sessions: sessions.length,
    pageviews: views,
    viewsPerSession: sessions.length ? views / n : 0,
    avgEngagedMs: sessions.length ? sessions.reduce((t, s) => t + s.engagedMs, 0) / n : 0,
    engagementRate: sessions.length ? engaged / n : 0,
    bounceRate: sessions.length ? 1 - engaged / n : 0,
    downloads: sessions.reduce((t, s) => t + s.downloads.length, 0),
    downloaders: downloaders.size,
    conversion: visitors.size ? downloaders.size / visitors.size : 0,
    leads: leads.length,
    leadRate: visitors.size ? leads.length / visitors.size : 0,
  };
}

export type Kpis = ReturnType<typeof kpis>;

/** Top values of key(); with val() it counts distinct val() per key (e.g. visitors per country). */
function rank<T>(items: T[], key: (t: T) => string | null | undefined, val?: (t: T) => string, n = 10) {
  const counts = new Map<string, number>();
  const sets = new Map<string, Set<string>>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    if (val) {
      const set = sets.get(k) ?? new Set<string>();
      set.add(val(it));
      sets.set(k, set);
    } else counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const entries = val ? [...sets.entries()].map(([name, s]) => ({ name, value: s.size })) : [...counts.entries()].map(([name, value]) => ({ name, value }));
  return entries.sort((a, b) => b.value - a.value).slice(0, n);
}

/** Calendar parts in the viewer's timezone. */
function parts(tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" });
  return (t: number) => {
    const p = Object.fromEntries(f.formatToParts(t).map((x) => [x.type, x.value]));
    return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), weekday: p.weekday as string };
  };
}

export function validTz(tz: string | undefined) {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export async function loadStats(range: RangeKey, filters: Filters, tz: string) {
  const days = RANGES[range];
  const now = Date.now();
  const from = now - days * 86_400_000;
  const prevFrom = from - days * 86_400_000;
  // Look back further than the comparison period so returning visitors can be recognised.
  const lookback = Math.min(prevFrom, now - 120 * 86_400_000);

  const [rows, leadRes] = await Promise.all([fetchEvents(new Date(lookback)), fetchLeads(new Date(prevFrom))]);
  const all = sessionize(rows);

  const cur = all.filter((s) => s.start >= from && matches(s, filters));
  const prev = all.filter((s) => s.start >= prevFrom && s.start < from && matches(s, filters));
  const earlier = (before: number) => new Set(all.filter((s) => s.start < before).map((s) => s.visitor));

  const filtered = Object.keys(filters).length > 0;
  const curVisitors = new Set(cur.map((s) => s.visitor));
  const prevVisitors = new Set(prev.map((s) => s.visitor));
  const leadsIn = (a: number, b: number, vs: Set<string>) =>
    leadRes.rows.filter((l) => {
      const t = Date.parse(l.created_at);
      return t >= a && t < b && (!filtered || (l.visitor !== null && vs.has(l.visitor)));
    });
  const curLeads = leadsIn(from, now + 3_600_000, curVisitors);

  // Time buckets in the viewer's timezone: hours for 24h, days otherwise.
  const p = parts(tz);
  const hourly = range === "24h";
  const step = hourly ? 3_600_000 : 86_400_000;
  const keyOf = (t: number) => {
    const q = p(t);
    return hourly ? `${q.day} ${String(q.hour).padStart(2, "0")}:00` : q.day;
  };
  const keys: string[] = [];
  for (let i = (hourly ? 24 : days) - 1; i >= 0; i--) {
    const k = keyOf(now - i * step);
    if (!keys.includes(k)) keys.push(k);
  }
  const bucket = new Map(keys.map((k) => [k, { visitors: new Set<string>(), sessions: 0, views: 0, downloads: 0 }]));
  for (const s of cur) {
    const b = bucket.get(keyOf(s.start));
    if (!b) continue;
    b.visitors.add(s.visitor);
    b.sessions++;
    b.views += s.pages.length;
    b.downloads += s.downloads.length;
  }
  const series = keys.map((k) => {
    const b = bucket.get(k)!;
    return { key: k, visitors: b.visitors.size, sessions: b.sessions, views: b.views, downloads: b.downloads };
  });

  // When visitors come: sessions by weekday and hour, in the viewer's timezone.
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heat = DAYS.map(() => Array(24).fill(0) as number[]);
  for (const s of cur) {
    const q = p(s.start);
    const d = DAYS.indexOf(q.weekday);
    if (d >= 0) heat[d][q.hour]++;
  }

  // Funnel by visitors: arrived -> saw the download page -> downloaded.
  const sawDownload = new Set(cur.filter((s) => s.pages.some((x) => x.startsWith("/download"))).map((s) => s.visitor));
  const downloaded = new Set(cur.filter((s) => s.downloads.length).map((s) => s.visitor));

  // Quality of each traffic source.
  const bySource = new Map<string, Session[]>();
  for (const s of cur) bySource.set(s.source, [...(bySource.get(s.source) ?? []), s]);
  const sources = [...bySource.entries()].map(([name, ss]) => {
    const v = new Set(ss.map((s) => s.visitor));
    const d = new Set(ss.filter((s) => s.downloads.length).map((s) => s.visitor));
    return { name, visitors: v.size, sessions: ss.length, engagement: ss.filter((s) => s.engaged).length / ss.length, downloaders: d.size, conversion: v.size ? d.size / v.size : 0 };
  }).sort((a, b) => b.visitors - a.visitors).slice(0, 12);

  // Pages: views, unique visitors, entrances, average visible time.
  const allowed = new Set(cur.map((s) => s.visitor));
  const pageMap = new Map<string, { views: number; visitors: Set<string>; time: number; timeN: number; entries: number }>();
  for (const r of rows) {
    if (Date.parse(r.created_at) < from || (r.type !== "pageview" && r.type !== "engage")) continue;
    if (filtered && !allowed.has(r.visitor)) continue;
    const e = pageMap.get(r.path) ?? { views: 0, visitors: new Set<string>(), time: 0, timeN: 0, entries: 0 };
    if (r.type === "pageview") { e.views++; e.visitors.add(r.visitor); }
    else if (r.duration_ms) { e.time += r.duration_ms; e.timeN++; }
    pageMap.set(r.path, e);
  }
  for (const s of cur) { const e = pageMap.get(s.landing); if (e) e.entries++; }
  const pages = [...pageMap.entries()].filter(([, e]) => e.views > 0)
    .map(([name, e]) => ({ name, views: e.views, visitors: e.visitors.size, entries: e.entries, avgMs: e.timeN ? e.time / e.timeN : 0 }))
    .sort((a, b) => b.views - a.views).slice(0, 12);

  const vis = (s: Session) => s.visitor;
  const dl = cur.flatMap((s) => s.downloads.map((d) => ({ d, s })));

  return {
    configured: db() !== null,
    range, tz, filters, hourly,
    now: kpis(cur, curLeads, earlier(from)),
    prev: kpis(prev, leadsIn(prevFrom, from, prevVisitors), earlier(prevFrom)),
    activeNow: new Set(rows.filter((r) => Date.parse(r.created_at) > now - 5 * 60_000).map((r) => r.visitor)).size,
    series,
    heat, heatDays: DAYS,
    funnel: [
      { name: "Visited the site", value: curVisitors.size },
      { name: "Opened the download page", value: sawDownload.size },
      { name: "Clicked a download", value: downloaded.size },
    ],
    sources,
    pages,
    platforms: rank(dl, (x) => x.d),
    downloadFrom: rank(cur.filter((s) => s.downloads.length), (s) => s.pages.at(-1) ?? s.landing),
    clicks: rank(cur.flatMap((s) => s.clicks.map((c) => ({ c, v: s.visitor }))), (x) => x.c, (x) => x.v, 14),
    campaigns: rank(cur.filter((s) => s.campaign), (s) => `${s.source} / ${s.campaign}`, vis),
    countries: rank(cur, (s) => s.country, vis, 12),
    cities: rank(cur, (s) => (s.city ? `${s.city}${s.country ? `, ${s.country}` : ""}` : null), vis),
    devices: rank(cur, (s) => s.device, vis),
    os: rank(cur, (s) => s.os, vis),
    browsers: rank(cur, (s) => s.browser, vis),
    langs: rank(cur, (s) => s.lang, vis),
    sessions: cur.slice(0, 40),
    leads: curLeads.slice(0, 25),
    quality: {
      dailyShare: cur.length ? cur.filter((s) => s.kind === "daily").length / cur.length : 0,
      v2: rows.some((r) => "id_kind" in r),
      leadsTable: leadRes.ready,
      events: rows.length,
    },
  };
}

export type Stats = Awaited<ReturnType<typeof loadStats>>;
