import { downloadUrl, isPlatform } from "@/lib/downloads";
import { record } from "@/lib/track";

// Every download goes through here so it is counted, then redirects to the real file.
// The page appends the visitor's anonymous id (?v=) so the download joins their journey.
export async function GET(req: Request, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;
  if (!isPlatform(platform)) return new Response("Unknown platform", { status: 404 });
  const q = new URL(req.url).searchParams;
  // x=1: the admin excluded this browser from the stats.
  if (q.get("x") !== "1") await record(req, {
    type: "download",
    path: q.get("from") ?? "/download",
    label: platform,
    vid: q.get("v"),
    session: q.get("s"),
  });
  return Response.redirect(downloadUrl(platform), 302);
}
