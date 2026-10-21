import { record, type EventInput } from "@/lib/track";

const TYPES = new Set(["pageview", "click", "engage"]);

export async function POST(req: Request) {
  let body: EventInput;
  try {
    // sendBeacon posts text/plain, so parse the raw text.
    const text = await req.text();
    if (text.length > 4000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || !TYPES.has(body.type)) return new Response(null, { status: 400 });
  await record(req, body);
  return new Response(null, { status: 204 });
}
