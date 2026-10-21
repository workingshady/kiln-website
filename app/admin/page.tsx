import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaChart, ColumnChart, ExcludeMe, Heatmap, TimezoneSync } from "@/components/Charts";
import { LogoMark } from "@/components/Logo";
import { isAdmin } from "@/lib/auth";
import { FILTER_KEYS, type Filters, type Kpis, loadStats, RANGES, type RangeKey, type Stats, validTz } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = Record<string, string | undefined>;

const n = (v: number) => v.toLocaleString("en-US");
const pct = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`;
const dur = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60_000)}m ${String(Math.round((ms % 60_000) / 1000)).padStart(2, "0")}s`);

const FILTER_LABEL: Record<string, string> = { source: "Source", page: "Page", country: "Country", device: "Device", os: "OS", browser: "Browser", visitor: "Visitor" };

/** Link to the dashboard with some params changed; undefined removes a param. */
function href(cur: Params, change: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...cur, ...change })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/admin?${s}` : "/admin";
}

function Delta({ now, prev, lowerIsBetter }: { now: number; prev: number; lowerIsBetter?: boolean }) {
  if (!prev) return <span className="delta">{now ? "new this period" : "no data before"}</span>;
  const d = (now - prev) / prev;
  if (Math.abs(d) < 0.005) return <span className="delta">no change</span>;
  const good = lowerIsBetter ? d < 0 : d > 0;
  return <span className={`delta ${good ? "up" : "down"}`}>{d > 0 ? "▲" : "▼"} {Math.abs(d * 100).toFixed(0)}% vs previous</span>;
}

type TileDef = { k: keyof Kpis; label: string; fmt: (v: number) => string; help: string; lower?: boolean };
const GROUPS: { title: string; tiles: TileDef[] }[] = [
  {
    title: "Audience",
    tiles: [
      { k: "visitors", label: "Unique visitors", fmt: n, help: "Distinct browsers. The same person on another day is the same visitor." },
      { k: "newVisitors", label: "New", fmt: n, help: "Browsers on their first ever visit." },
      { k: "returning", label: "Returning", fmt: n, help: "Browsers that had been here before." },
      { k: "sessions", label: "Sessions", fmt: n, help: "Visits. A new one starts after 30 minutes without activity." },
    ],
  },
  {
    title: "Engagement",
    tiles: [
      { k: "engagementRate", label: "Engaged sessions", fmt: pct, help: "Lasted 10 s+, viewed 2+ pages, downloaded, or left an email." },
      { k: "bounceRate", label: "Bounce rate", fmt: pct, help: "Sessions that were not engaged (1 - engagement rate).", lower: true },
      { k: "viewsPerSession", label: "Pages / session", fmt: (v) => v.toFixed(1), help: "Page views divided by sessions." },
      { k: "avgEngagedMs", label: "Engaged time / session", fmt: dur, help: "Time the page was actually visible, averaged over sessions." },
    ],
  },
  {
    title: "Conversion",
    tiles: [
      { k: "downloaders", label: "Visitors who downloaded", fmt: n, help: "Distinct visitors with at least one download." },
      { k: "conversion", label: "Download conversion", fmt: pct, help: "Visitors who downloaded / unique visitors." },
      { k: "downloads", label: "Download clicks", fmt: n, help: "Every click on a download link, repeats included." },
      { k: "leads", label: "Release sign-ups", fmt: n, help: "Emails left on the release form." },
    ],
  },
];

function Ranked({ title, rows, filterKey, cur, empty = "Nothing yet", unit = "visitors" }: { title: string; rows: { name: string; value: number }[]; filterKey?: string; cur: Params; empty?: string; unit?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="panel">
      <h2>{title} <small>{unit}</small></h2>
      {rows.length === 0 ? <p className="muted">{empty}</p> : (
        <table className="ranked">
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>
                  <span className="rbar" style={{ width: `${(r.value / max) * 100}%` }} />
                  {filterKey ? <Link className="rname" href={href(cur, { [filterKey]: r.name })} title={`Filter by ${r.name}`}>{r.name}</Link> : <span className="rname">{r.name}</span>}
                </td>
                <td className="num">{n(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function Admin({ searchParams }: { searchParams: Promise<Params> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const range: RangeKey = sp.range && sp.range in RANGES ? (sp.range as RangeKey) : "7d";
  const filters: Filters = {};
  for (const k of FILTER_KEYS) if (sp[k]) filters[k] = sp[k]!.slice(0, 200);
  const cur: Params = { range, ...filters };
  const tz = validTz((await cookies()).get("kiln_tz")?.value);

  let s: Stats;
  try {
    s = await loadStats(range, filters, tz);
  } catch (e) {
    return (
      <div className="admin wrap"><div className="panel warn"><h2>Couldn&apos;t load analytics</h2><p className="muted">{(e as Error).message}</p></div></div>
    );
  }
  const when = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const label = (k: string) => (s.hourly ? k.slice(11) : new Date(`${k}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }));
  const funnelTop = s.funnel[0].value || 1;

  return (
    <div className="admin">
      <TimezoneSync current={tz} />
      <header className="admin-bar">
        <div className="wrap admin-bar-in">
          <Link href="/" className="brand"><LogoMark size={28} /><span>Kiln</span></Link>
          <span className="live" title="Visitors with activity in the last 5 minutes"><i />{s.activeNow} active now</span>
          <nav className="ranges" aria-label="Date range">
            {(Object.keys(RANGES) as RangeKey[]).map((r) => (
              <Link key={r} href={href(cur, { range: r })} aria-current={r === range ? "page" : undefined}>{r}</Link>
            ))}
          </nav>
          <form method="post" action="/api/admin/logout"><button className="btn" type="submit">Sign out</button></form>
        </div>
      </header>

      <div className="wrap admin-body">
        <div className="filterbar">
          <span className="muted mono">{tz} · {s.hourly ? "hourly" : "daily"} · compared with the previous {range}</span>
          {Object.entries(filters).map(([k, v]) => (
            <Link key={k} className="chip" href={href(cur, { [k]: undefined })} title="Remove filter">{FILTER_LABEL[k]}: <b>{k === "visitor" ? v.slice(0, 8) : v}</b> ×</Link>
          ))}
          {Object.keys(filters).length > 1 && <Link className="chip clear" href={href({ range }, {})}>Clear all</Link>}
          <ExcludeMe />
        </div>

        {!s.configured && <div className="panel warn"><h2>Supabase isn&apos;t connected</h2><p className="muted">Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and redeploy.</p></div>}
        {s.configured && !s.quality.leadsTable && (
          <div className="panel warn">
            <h2>One database step left</h2>
            <p className="muted">Run <code>supabase/migrations/002_visitors_sessions_leads.sql</code> in the Supabase SQL editor. It adds returning-visitor tracking and the release sign-up table. Until then, visitors from before today count per day and sign-ups can&apos;t be saved.</p>
          </div>
        )}

        {GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h3 className="group-title">{g.title}</h3>
            <div className="tiles">
              {g.tiles.map((t) => (
                <div key={t.k} className="tile" title={t.help}>
                  <span className="tile-l">{t.label}</span>
                  <span className="tile-v">{t.fmt(s.now[t.k])}</span>
                  <Delta now={s.now[t.k]} prev={s.prev[t.k]} lowerIsBetter={t.lower} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="grid-2">
          <div className="panel">
            <h2>Unique visitors per {s.hourly ? "hour" : "day"}</h2>
            <AreaChart unit="visitors" data={s.series.map((x) => ({ label: label(x.key), value: x.visitors }))} />
          </div>
          <div className="panel">
            <h2>Download clicks per {s.hourly ? "hour" : "day"}</h2>
            <ColumnChart unit="downloads" data={s.series.map((x) => ({ label: label(x.key), value: x.downloads }))} />
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <h2>Funnel <small>visitors</small></h2>
            <ol className="funnel">
              {s.funnel.map((f, i) => {
                return (
                  <li key={f.name}>
                    <div className="funnel-bar" style={{ width: `${Math.max((f.value / funnelTop) * 100, f.value ? 2 : 0)}%` }} />
                    <span className="funnel-name">{f.name}</span>
                    <span className="num">{n(f.value)}</span>
                    <span className="funnel-step">{i === 0 ? "everyone in this period" : `${pct(f.value / funnelTop)} of visitors`}</span>
                  </li>
                );
              })}
            </ol>
            <p className="muted small">Download buttons are also on the home page, so people can download without opening /download. Release sign-ups: {n(s.now.leads)} ({pct(s.now.leadRate)} of visitors).</p>
          </div>
          <div className="panel">
            <h2>When visitors come <small>sessions, {tz}</small></h2>
            <Heatmap grid={s.heat} days={s.heatDays} />
          </div>
        </div>

        <div className="panel">
          <h2>Traffic sources <small>click one to filter</small></h2>
          {s.sources.length === 0 ? <p className="muted">Nothing yet</p> : (
            <div className="table-scroll">
              <table className="events data">
                <thead><tr><th>Source</th><th className="r">Visitors</th><th className="r">Sessions</th><th className="r">Engaged</th><th className="r">Downloaded</th><th className="r">Conversion</th></tr></thead>
                <tbody>
                  {s.sources.map((r) => (
                    <tr key={r.name}>
                      <td><Link href={href(cur, { source: r.name })}>{r.name}</Link></td>
                      <td className="r">{n(r.visitors)}</td><td className="r">{n(r.sessions)}</td>
                      <td className="r">{pct(r.engagement)}</td><td className="r">{n(r.downloaders)}</td><td className="r">{pct(r.conversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Pages <small>click one to see sessions that viewed it</small></h2>
          {s.pages.length === 0 ? <p className="muted">Nothing yet</p> : (
            <div className="table-scroll">
              <table className="events data">
                <thead><tr><th>Page</th><th className="r">Views</th><th className="r">Visitors</th><th className="r">Entrances</th><th className="r">Avg. visible time</th></tr></thead>
                <tbody>
                  {s.pages.map((r) => (
                    <tr key={r.name}>
                      <td className="mono"><Link href={href(cur, { page: r.name })}>{r.name}</Link></td>
                      <td className="r">{n(r.views)}</td><td className="r">{n(r.visitors)}</td><td className="r">{n(r.entries)}</td><td className="r">{r.avgMs ? dur(r.avgMs) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid-3">
          <Ranked cur={cur} title="Downloads by platform" rows={s.platforms} unit="clicks" />
          <Ranked cur={cur} title="Last page before download" rows={s.downloadFrom} unit="sessions" />
          <Ranked cur={cur} title="Clicks" rows={s.clicks} unit="visitors" />
          <Ranked cur={cur} title="Campaigns" rows={s.campaigns} empty="Tag ad links with ?utm_source=…&utm_campaign=…" />
          <Ranked cur={cur} title="Countries" rows={s.countries} filterKey="country" empty="Countries appear on the Vercel deployment" />
          <Ranked cur={cur} title="Cities" rows={s.cities} empty="Cities appear on the Vercel deployment" />
          <Ranked cur={cur} title="Devices" rows={s.devices} filterKey="device" />
          <Ranked cur={cur} title="Operating systems" rows={s.os} filterKey="os" />
          <Ranked cur={cur} title="Browsers" rows={s.browsers} filterKey="browser" />
          <Ranked cur={cur} title="Languages" rows={s.langs} />
        </div>

        <div className="panel">
          <h2>Latest sessions <small>click a visitor to follow them</small></h2>
          {s.sessions.length === 0 ? <p className="muted">No sessions in this range.</p> : (
            <div className="table-scroll">
              <table className="events">
                <thead><tr><th>Started</th><th>Visitor</th><th>Source</th><th>Where</th><th>Device</th><th>Journey</th><th className="r">Time</th></tr></thead>
                <tbody>
                  {s.sessions.map((x) => (
                    <tr key={x.visitor + x.start}>
                      <td className="mono">{when.format(x.start)}</td>
                      <td>
                        <Link className="mono" href={href(cur, { visitor: x.visitor })}>{x.visitor.slice(0, 8)}</Link>{" "}
                        {x.firstVisit ? <span className="pill t-new">new</span> : x.kind === "daily" ? <span className="pill" title="Storage blocked or an older row: identified for this day only">day id</span> : <span className="pill">returning</span>}
                      </td>
                      <td>{x.source}{x.campaign ? ` / ${x.campaign}` : ""}</td>
                      <td>{[x.city, x.country].filter(Boolean).join(", ")}</td>
                      <td className="muted">{[x.device, x.os, x.browser].filter(Boolean).join(" · ")}</td>
                      <td className="journey">
                        {x.pages.map((pg, i) => <span key={i} className="mono">{pg}</span>)}
                        {x.downloads.map((d, i) => <span key={`d${i}`} className="pill t-download">⬇ {d}</span>)}
                        {x.lead && <span className="pill t-click">✉ sign-up</span>}
                      </td>
                      <td className="r">{dur(x.durationMs)}{x.engaged ? "" : <span className="muted"> · bounced</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Release sign-ups</h2>
          {!s.quality.leadsTable ? <p className="muted">Run migration 002 to enable sign-ups.</p> : s.leads.length === 0 ? <p className="muted">No sign-ups in this range.</p> : (
            <div className="table-scroll">
              <table className="events">
                <thead><tr><th>When</th><th>Email</th><th>Platform</th><th>Source</th><th>Country</th><th>Visitor</th></tr></thead>
                <tbody>
                  {s.leads.map((l) => (
                    <tr key={l.email}>
                      <td className="mono">{when.format(Date.parse(l.created_at))}</td>
                      <td><a href={`mailto:${l.email}`}>{l.email}</a></td>
                      <td>{l.platform}</td>
                      <td>{l.utm_source ?? "–"}{l.utm_campaign ? ` / ${l.utm_campaign}` : ""}</td>
                      <td>{l.country ?? "–"}</td>
                      <td>{l.visitor ? <Link className="mono" href={href(cur, { visitor: l.visitor })}>{l.visitor.slice(0, 8)}</Link> : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <details className="panel defs">
          <summary>How these numbers are counted</summary>
          <dl>
            <dt>Visitor</dt><dd>One browser, identified by an anonymous random id kept in that browser (no cookie, no IP stored). If storage is blocked, the server uses a salted hash of IP and browser that changes every day, so those visitors can count once per day. This period: {pct(s.quality.dailyShare)} of sessions used the daily fallback.</dd>
            <dt>Session</dt><dd>A visitor&apos;s activity with no gap longer than 30 minutes, the same rule as Google Analytics 4. A session continues across midnight and across tabs.</dd>
            <dt>Engaged / bounce</dt><dd>Engaged if the session lasted 10 seconds or more, viewed 2 or more pages, downloaded, or left an email. Bounce rate is the rest, as in GA4.</dd>
            <dt>Engaged time</dt><dd>Only time the tab was visible counts.</dd>
            <dt>Source</dt><dd>From the first page of the session: utm_source (or ?ref=) if present, else the referring site, else Direct.</dd>
            <dt>Conversion</dt><dd>Visitors who clicked a download, divided by unique visitors. Repeat clicks count once here, but every click shows in Download clicks.</dd>
            <dt>Excluded</dt><dd>Bots and headless browsers (by user agent), the /admin pages, and any browser that ticked &ldquo;Don&apos;t count my visits&rdquo;.</dd>
            <dt>Data</dt><dd>{n(s.quality.events)} events scanned (120-day lookback, for returning visitors). Times shown in {tz}.</dd>
          </dl>
        </details>
      </div>
    </div>
  );
}
