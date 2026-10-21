import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaChart, ColumnChart } from "@/components/Charts";
import { LogoMark } from "@/components/Logo";
import { isAdmin } from "@/lib/auth";
import { loadStats, type Stats } from "@/lib/stats";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90];

const n = (v: number) => v.toLocaleString("en-US");
const dur = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`);

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev) return <span className="delta">no earlier data</span>;
  const d = (now - prev) / prev;
  const up = d >= 0;
  return (
    <span className={`delta ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(d * 100).toFixed(0)}% vs previous period
    </span>
  );
}

function Tile({ label, value, now, prev }: { label: string; value: string; now: number; prev: number }) {
  return (
    <div className="tile">
      <span className="tile-l">{label}</span>
      <span className="tile-v">{value}</span>
      <Delta now={now} prev={prev} />
    </div>
  );
}

function Ranked({ title, rows, empty = "Nothing yet" }: { title: string; rows: { name: string; value: number }[]; empty?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <table className="ranked">
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>
                  <span className="rbar" style={{ width: `${(r.value / max) * 100}%` }} />
                  <span className="rname">{r.name}</span>
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

function Empty({ s }: { s: Stats }) {
  if (!s.configured)
    return (
      <div className="panel warn">
        <h2>Supabase isn&apos;t connected</h2>
        <p className="muted">Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, run supabase/schema.sql, and redeploy. Events will show up here.</p>
      </div>
    );
  if (s.total === 0)
    return (
      <div className="panel">
        <h2>No events in this range yet</h2>
        <p className="muted">Open the site in another tab. Page views appear within a few seconds.</p>
      </div>
    );
  return null;
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { days: d } = await searchParams;
  const days = RANGES.includes(Number(d)) ? Number(d) : 30;

  let s: Stats;
  try {
    s = await loadStats(days);
  } catch (e) {
    return (
      <div className="admin wrap">
        <div className="panel warn">
          <h2>Couldn&apos;t load analytics</h2>
          <p className="muted">{(e as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="wrap admin-bar-in">
          <Link href="/" className="brand"><LogoMark size={28} /><span>Kiln</span></Link>
          <span className="muted mono">control room</span>
          <nav className="ranges" aria-label="Date range">
            {RANGES.map((r) => (
              <Link key={r} href={`/admin?days=${r}`} aria-current={r === days ? "page" : undefined}>{r}d</Link>
            ))}
          </nav>
          <form method="post" action="/api/admin/logout">
            <button className="btn" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <div className="wrap admin-body">
        <Empty s={s} />

        <div className="tiles">
          <Tile label="Visitors" value={n(s.now.visitors)} now={s.now.visitors} prev={s.prev.visitors} />
          <Tile label="Page views" value={n(s.now.views)} now={s.now.views} prev={s.prev.views} />
          <Tile label="Downloads" value={n(s.now.downloads)} now={s.now.downloads} prev={s.prev.downloads} />
          <Tile label="Visitors who downloaded" value={`${(s.now.rate * 100).toFixed(1)}%`} now={s.now.rate} prev={s.prev.rate} />
          <Tile label="Avg. time on page" value={dur(s.now.avgMs)} now={s.now.avgMs} prev={s.prev.avgMs} />
          <Tile label="Tracked clicks" value={n(s.now.clicks)} now={s.now.clicks} prev={s.prev.clicks} />
        </div>

        <div className="grid-2">
          <div className="panel">
            <h2>Visitors per day</h2>
            <AreaChart label="Visitors" data={s.series.map((x) => ({ day: x.day, value: x.visitors }))} />
          </div>
          <div className="panel">
            <h2>Downloads per day</h2>
            <ColumnChart label="Downloads" data={s.series.map((x) => ({ day: x.day, value: x.downloads }))} />
          </div>
        </div>

        <div className="grid-3">
          <Ranked title="Downloads by platform" rows={s.platforms} />
          <Ranked title="Where downloads were clicked" rows={s.downloadSources} />
          <Ranked title="Top clicks" rows={s.clicks} />
          <Ranked title="Top pages" rows={s.pages} />
          <Ranked title="Referrers" rows={s.referrers} />
          <Ranked title="Campaigns (utm_source / campaign)" rows={s.campaigns} empty="Add ?utm_source=… to ad links to see them here" />
          <Ranked title="Countries" rows={s.countries} empty="Countries appear once deployed on Vercel" />
          <Ranked title="Cities" rows={s.cities} empty="Cities appear once deployed on Vercel" />
          <Ranked title="Operating systems" rows={s.os} />
          <Ranked title="Browsers" rows={s.browsers} />
          <Ranked title="Devices" rows={s.devices} />
        </div>

        <div className="panel">
          <h2>Latest events</h2>
          <div className="table-scroll">
            <table className="events">
              <thead>
                <tr><th>When (UTC)</th><th>Type</th><th>Page</th><th>Detail</th><th>From</th><th>Where</th><th>Device</th></tr>
              </thead>
              <tbody>
                {s.recent.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r.created_at.slice(5, 16).replace("T", " ")}</td>
                    <td><span className={`pill t-${r.type}`}>{r.type}</span></td>
                    <td className="mono">{r.path}</td>
                    <td>{r.label ?? ""}</td>
                    <td>{r.referrer ?? r.utm_source ?? ""}</td>
                    <td>{[r.city, r.country].filter(Boolean).join(", ")}</td>
                    <td className="muted">{[r.os, r.browser].filter(Boolean).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="muted small">
          Visitors are counted per day from a salted hash of IP and browser; the hash changes daily and no cookies or IPs are stored.
          Bots are filtered by user agent.
        </p>
      </div>
    </div>
  );
}
