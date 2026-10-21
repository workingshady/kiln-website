import { downloadUrl, isPlatform } from "@/lib/downloads";
import { record } from "@/lib/track";

// Every download goes through here so it is counted, then redirects to the real file.
export async function GET(req: Request, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;
  if (!isPlatform(platform)) return new Response("Unknown platform", { status: 404 });
  const url = new URL(req.url);
  await record(req, {
    type: "download",
    path: url.searchParams.get("from") ?? "/download",
    label: platform,
    referrer: req.headers.get("referer"),
  });
  return Response.redirect(downloadUrl(platform), 302);
}
