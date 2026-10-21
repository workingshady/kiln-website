"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { ArrowDown, GitHubIcon, LogoMark } from "./Logo";

export function Nav() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  if (path.startsWith("/admin")) return null;

  return (
    <header className="nav" data-scrolled={scrolled} data-open={open}>
      <div className="wrap nav-in">
        <Link href="/" className="brand" aria-label="Kiln home" data-track="nav:logo">
          <LogoMark />
          <span>Kiln</span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined} data-track={`nav:${n.label}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav-end">
          <a className="gh" href={site.repo} target="_blank" rel="noopener" data-track="nav:github">
            <GitHubIcon /> Source
          </a>
          <Link className="btn btn-fire" href="/download" data-track="nav:download">
            <ArrowDown /> <span>Download</span>
          </Link>
          <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M3 3l12 12M15 3 3 15" /> : <path d="M2 5h14M2 9h14M2 13h9" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
