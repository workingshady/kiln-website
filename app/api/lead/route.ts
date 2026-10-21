import { db } from "@/lib/supabase";
import { record } from "@/lib/track";
import { isBot } from "@/lib/ua";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const PLATFORMS = new Set(["windows", "mac", "linux", "any"]);

/** "Email me when it's released": stores one row per address in public.leads. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 2000) return Response.json({ ok: false }, { status: 413 });
    b = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  // Honeypot: real people never fill the hidden "website" field.
  if (b.website) return Response.json({ ok: true });
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return Response.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  if (isBot(req.headers.get("user-agent") ?? "")) return Response.json({ ok: true });

  const client = db();
  if (!client) return Response.json({ ok: false, error: "Sign-ups aren't available right now." }, { status: 503 });

  const str = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);
  const platform = typeof b.platform === "string" && PLATFORMS.has(b.platform) ? b.platform : "any";
  const vid = typeof b.vid === "string" && /^[a-z0-9]{8,32}$/.test(b.vid) ? b.vid : null;
  const { error } = await client.from("leads").insert({
    email,
    platform,
    path: str(b.path, 200),
    visitor: vid,
    country: str(req.headers.get("x-vercel-ip-country"), 8),
    utm_source: str(b.utm_source, 80),
    utm_campaign: str(b.utm_campaign, 80),
  });
  // 23505 = already signed up; that's fine, say yes again.
  if (error && error.code !== "23505") {
    console.error("lead insert failed", error.message);
    return Response.json({ ok: false, error: "Couldn't save that. Try again in a minute." }, { status: 500 });
  }
  if (!error) await record(req, { type: "click", path: str(b.path, 200) ?? "/download", label: `lead:${platform}`, vid });
  return Response.json({ ok: true });
}
