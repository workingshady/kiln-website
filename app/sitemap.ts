import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/download", "/features", "/guide", "/changelog"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : p === "/download" ? 0.9 : 0.6,
  }));
}
