import "server-only";
import { createHash } from "node:crypto";
import { db } from "./supabase";
import { isBot, parseUA } from "./ua";

export type EventInput = {
  type: "pageview" | "click" | "download" | "engage";
  path?: string;
  label?: string | null;
  referrer?: string | null;
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  session?: string | null;
  duration_ms?: number | null;
  vid?: string | null; // anonymous id from the visitor's browser
  isNew?: boolean;
  lang?: string | null;
  screen?: number | null;
};

const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);
const ID = /^[a-z0-9]{8,32}$/;

function refHost(ref: string | null | undefined, self: string | null) {
  if (!ref) return null;
  if (ref === "(direct)") return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    return host && host !== self ? host : null;
  } catch {
    return null;
  }
}

/** The fallback id: same person = same hash for one day only; the raw IP is never stored. */
function dailyHash(req: Request, ua: string) {
  const h = req.headers;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "0";
  const day = new Date().toISOString().slice(0, 10);
  return "h" + createHash("sha256").update(`${process.env.ADMIN_SECRET ?? "kiln"}|${day}|${ip}|${ua}`).digest("hex").slice(0, 19);
}

// Columns added by migration 002. Until it has been run, rows are written without them.
const V2 = ["id_kind", "is_new", "region", "lang", "screen", "utm_term", "utm_content"] as const;
let v2Missing = false;

/** Records one event. Never throws: analytics must not break the page or a download. */
export async function record(req: Request, e: EventInput) {
  try {
    const client = db();
    const ua = req.headers.get("user-agent") ?? "";
    if (!client || isBot(ua)) return;

    const h = req.headers;
    const device = typeof e.vid === "string" && ID.test(e.vid);
    const self = h.get("host")?.replace(/^www\./, "").split(":")[0] ?? null;
    const { os, browser, device: form } = parseUA(ua);
    const dec = (v: string | null) => (v ? clip(decodeURIComponent(v), 80) : null);

    const row: Record<string, unknown> = {
      type: e.type,
      path: clip(e.path, 300) ?? "/",
      label: clip(e.label, 120),
      referrer: refHost(e.referrer, self),
      utm_source: clip(e.utm?.source, 80),
      utm_medium: clip(e.utm?.medium, 80),
      utm_campaign: clip(e.utm?.campaign, 80),
      country: clip(h.get("x-vercel-ip-country"), 8),
      city: dec(h.get("x-vercel-ip-city")),
      device: form,
      os,
      browser,
      visitor: device ? e.vid : dailyHash(req, ua),
      session: clip(e.session, 40),
      duration_ms:
        typeof e.duration_ms === "number" && e.duration_ms > 0 ? Math.min(Math.round(e.duration_ms), 3_600_000) : null,
      id_kind: device ? "device" : "daily",
      is_new: e.isNew === true ? true : null,
      region: dec(h.get("x-vercel-ip-country-region")),
      lang: clip(e.lang, 16),
      screen: typeof e.screen === "number" && e.screen > 0 ? Math.min(Math.round(e.screen), 10000) : null,
      utm_term: clip(e.utm?.term, 80),
      utm_content: clip(e.utm?.content, 80),
    };
    if (v2Missing) for (const k of V2) delete row[k];

    let { error } = await client.from("events").insert(row);
    if (error && !v2Missing && /column|schema cache/i.test(error.message)) {
      v2Missing = true; // migration 002 not run yet
      for (const k of V2) delete row[k];
      ({ error } = await client.from("events").insert(row));
    }
    if (error) console.error("analytics insert failed", error.message);
  } catch (err) {
    console.error("analytics insert failed", err);
  }
}
