"use client";

import { useEffect, useState } from "react";
import type { Platform } from "@/lib/downloads";
import { AppleIcon, CodeIcon, WindowsIcon } from "./Logo";

export type Detected = "windows" | "mac" | "linux" | "mobile" | null;

export function detectOS(): Detected {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  if (nav.userAgentData?.mobile) return "mobile";
  const p = (nav.userAgentData?.platform || navigator.platform || "").toLowerCase();
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|android/.test(ua) || (/mac/.test(p) && navigator.maxTouchPoints > 1)) return "mobile";
  if (/win/.test(p) || /windows/.test(ua)) return "windows";
  if (/mac/.test(p) || /mac os x/.test(ua)) return "mac";
  if (/linux|cros/.test(p) || /linux/.test(ua)) return "linux";
  return null;
}

export function useOS() {
  const [os, setOS] = useState<Detected>(null);
  useEffect(() => setOS(detectOS()), []);
  return os;
}

const ICON = { windows: WindowsIcon, mac: AppleIcon, "mac-intel": AppleIcon, source: CodeIcon };

export function href(p: Platform, from: string) {
  return `/api/download/${p}?from=${encodeURIComponent(from)}`;
}

/** The three platform columns; the visitor's own is marked and lit. */
export function PlatformCards() {
  const os = useOS();
  const mine = (p: string) => (os === p || (p === "source" && os === "linux") ? true : undefined);
  return (
    <div className="platforms">
      <div className="plat" data-mine={mine("windows")}>
        <h3><WindowsIcon size={26} /> Windows {mine("windows") && <span className="mine-tag">your system</span>}</h3>
        <ul>
          <li>Windows 10 or 11, 64-bit</li>
          <li>A GPU with OpenGL 4.1</li>
          <li>Portable .zip, nothing to install</li>
        </ul>
        <span className="file">Kiln-win64.zip</span>
        <a className="btn btn-fire" href={href("windows", "/download")} data-track="download:card-windows"><WindowsIcon /> Download for Windows</a>
      </div>
      <div className="plat" data-mine={mine("mac")}>
        <h3><AppleIcon size={26} /> macOS {mine("mac") && <span className="mine-tag">your system</span>}</h3>
        <ul>
          <li>macOS 11 Big Sur or later</li>
          <li>Apple silicon (M1 and newer)</li>
          <li>Drag-to-Applications .dmg</li>
        </ul>
        <span className="file">Kiln.dmg · <a href={href("mac-intel", "/download")} data-track="download:card-mac-intel">Intel Mac build</a></span>
        <a className="btn btn-fire" href={href("mac", "/download")} data-track="download:card-mac"><AppleIcon /> Download for macOS</a>
      </div>
      <div className="plat" data-mine={mine("source")}>
        <h3><CodeIcon size={26} /> Source {mine("source") && <span className="mine-tag">for Linux</span>}</h3>
        <ul>
          <li>Linux, or any OS with OpenGL 4.1</li>
          <li>CMake and a C++20 compiler</li>
          <li>Dependencies download themselves</li>
        </ul>
        <span className="file">github.com/muhammadhassan2/Kiln</span>
        <a className="btn" href={href("source", "/download")} data-track="download:card-source"><CodeIcon /> Get the source</a>
      </div>
    </div>
  );
}

export function DetectedNote() {
  const os = useOS();
  const text =
    os === "mobile" ? "You're on a phone or tablet. Kiln is a desktop app, so send this page to your computer."
    : os === "linux" ? "On Linux, build from source. It takes a few minutes the first time."
    : os ? "We picked the build for your system. Other platforms are below."
    : "Choose your platform below.";
  return <p className="dl-note">{text}</p>;
}

/** One big button for the visitor's OS. Everyone else is pointed at the full list. */
export function DownloadButton({ from, size = "lg" }: { from: string; size?: "lg" | "md" }) {
  const os = useOS();
  const p: Platform | null = os === "windows" ? "windows" : os === "mac" ? "mac" : os === "linux" ? "source" : null;

  if (!p) {
    return (
      <a className="btn btn-fire" href="/download" data-track={`cta:${from}:all`} style={size === "lg" ? { padding: "18px 26px", fontSize: 17 } : undefined}>
        Download Kiln <small>Windows · macOS</small>
      </a>
    );
  }
  const Icon = ICON[p];
  const label = p === "source" ? "Build from source" : `Download for ${p === "mac" ? "macOS" : "Windows"}`;
  return (
    <a className="btn btn-fire" href={href(p, from)} data-track={`cta:${from}:${p}`} style={size === "lg" ? { padding: "18px 26px", fontSize: 17 } : undefined}>
      <Icon /> {label}
    </a>
  );
}
