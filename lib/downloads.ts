import { site } from "./site";

export type Platform = "windows" | "mac" | "mac-intel" | "source";

export const platforms: Record<Platform, { label: string; file: string; note: string }> = {
  windows: { label: "Windows", file: "Kiln-win64.zip", note: "Windows 10 / 11, 64-bit · OpenGL 4.1 GPU" },
  mac: { label: "macOS", file: "Kiln.dmg", note: "macOS 11+ · Apple silicon" },
  "mac-intel": { label: "macOS (Intel)", file: "Kiln-intel.dmg", note: "macOS 11+ · Intel" },
  source: { label: "Source", file: "github.com/muhammadhassan2/Kiln", note: "CMake 3.24+ · any OS with OpenGL 4.1" },
};

export function isPlatform(p: string): p is Platform {
  return p in platforms;
}

/** Real download target; falls back to the GitHub releases page until binaries are uploaded. */
export function downloadUrl(p: Platform): string {
  const env = {
    windows: process.env.DOWNLOAD_URL_WINDOWS,
    mac: process.env.DOWNLOAD_URL_MAC,
    "mac-intel": process.env.DOWNLOAD_URL_MAC_INTEL || process.env.DOWNLOAD_URL_MAC,
    source: site.repo,
  }[p];
  return env || site.releases;
}
