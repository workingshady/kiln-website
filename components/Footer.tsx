"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";

export function Footer() {
  if (usePathname().startsWith("/admin")) return null;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link href="/" className="brand" style={{ color: "var(--bone)" }}>
              <LogoMark size={28} />
              <span>Kiln</span>
            </Link>
            <p style={{ marginTop: 14, maxWidth: "34ch" }}>
              A live shader editor for mobile video effects and transitions. Free and open source, written in C++ and OpenGL.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/download" data-track="footer:download">Download</Link></li>
              <li><Link href="/changelog">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li><Link href="/guide">Guide</Link></li>
              <li><Link href="/guide#controls">Uniform controls</Link></li>
              <li><Link href="/guide#shortcuts">Shortcuts</Link></li>
            </ul>
          </div>
          <div>
            <h4>Project</h4>
            <ul>
              <li><a href={site.repo} target="_blank" rel="noopener" data-track="footer:github">GitHub</a></li>
              <li><a href={`${site.repo}/issues`} target="_blank" rel="noopener" data-track="footer:issues">Report a bug</a></li>
              <li><a href={site.releases} target="_blank" rel="noopener">Releases</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <span>© {new Date().getFullYear()} Kiln contributors</span>
          <span>No cookies. An anonymous ID in your browser counts return visits.</span>
        </div>
      </div>
    </footer>
  );
}
