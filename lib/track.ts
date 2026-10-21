import "server-only";
import { createHash } from "node:crypto";
import { db } from "./supabase";
import { isBot, parseUA } from "./ua";

export type EventInput = {
  type: "pageview" | "click" | "download" | "engage";
  path?: string;
  label?: string | null;
  referrer?: string | null;
  utm?: { source?: string; medium?: string; campaign?: string };
  session?: string | null;
  duration_ms?: number | null;
};

const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

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

/** Records one event. Never throws: analytics must not break the page or a download. */
export async function record(req: Request, e: EventInput) {
  try {
    const client = db();
    const ua = req.headers.get("user-agent") ?? "";
    if (!client || isBot(ua)) return;

    const h = req.headers;
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "0";
    const day = new Date().toISOString().slice(0, 10);
    // Same person = same hash for one day only; the raw IP is never stored.
    const visitor = createHash("sha256")
      .update(`${process.env.ADMIN_SECRET ?? "kiln"}|${day}|${ip}|${ua}`)
      .digest("hex")
      .slice(0, 20);
    const self = h.get("host")?.replace(/^www\./, "").split(":")[0] ?? null;
    const { os, browser, device } = parseUA(ua);
    const city = h.get("x-vercel-ip-city");

    await client.from("events").insert({
      type: e.type,
      path: clip(e.path, 300) ?? "/",
      label: clip(e.label, 120),
      referrer: refHost(e.referrer, self),
      utm_source: clip(e.utm?.source, 80),
      utm_medium: clip(e.utm?.medium, 80),
      utm_campaign: clip(e.utm?.campaign, 80),
      country: clip(h.get("x-vercel-ip-country"), 8),
      city: city ? clip(decodeURIComponent(city), 80) : null,
      device,
      os,
      browser,
      visitor,
      session: clip(e.session, 40),
      duration_ms:
        typeof e.duration_ms === "number" && e.duration_ms > 0
          ? Math.min(Math.round(e.duration_ms), 3_600_000)
          : null,
    });
  } catch (err) {
    console.error("analytics insert failed", err);
  }
}
