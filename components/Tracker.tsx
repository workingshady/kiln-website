"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_GAP = 30 * 60 * 1000; // GA4's default: 30 minutes without activity ends a session

const store = {
  get(k: string) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); return true; } catch { return false; }
  },
};

const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);

/** Anonymous id kept in this browser only, so a returning visitor is recognised across days. */
function visitor(): { vid: string | null; isNew: boolean } {
  let vid = store.get("kiln_vid");
  if (vid) return { vid, isNew: false };
  vid = rand();
  // If storage is blocked the server falls back to a daily hash, and the visit isn't flagged as new.
  return store.set("kiln_vid", vid) ? { vid, isNew: true } : { vid: null, isNew: false };
}

/** Session id that rotates after 30 minutes of inactivity, across tabs. */
function session() {
  const now = Date.now();
  const [id, last] = (store.get("kiln_sess") ?? "").split(":");
  const sid = id && now - Number(last) < SESSION_GAP ? id : rand();
  store.set("kiln_sess", `${sid}:${now}`);
  return sid;
}

export const ignored = () => store.get("kiln_ignore") === "1";

function send(data: Record<string, unknown>) {
  if (ignored()) return;
  const body = JSON.stringify(data);
  if (navigator.sendBeacon?.("/api/track", body)) return;
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** Page views, time on page, clicks on anything marked data-track (plus outbound links), and download attribution. */
export function Tracker() {
  const path = usePathname();
  const visible = useRef(0); // ms of visible time on the current page
  const since = useRef(0); // when the current visible stretch started (0 = hidden)
  const first = useRef(true);
  const who = useRef<{ vid: string | null; isNew: boolean } | null>(null);

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    who.current ??= visitor();
    const { vid, isNew } = who.current;
    const q = new URLSearchParams(location.search);
    send({
      type: "pageview",
      path,
      vid,
      isNew: first.current && isNew,
      session: session(),
      // Only the landing view carries the external referrer.
      referrer: first.current ? document.referrer || "(direct)" : null,
      utm: {
        source: q.get("utm_source") ?? q.get("ref") ?? undefined,
        medium: q.get("utm_medium") ?? undefined,
        campaign: q.get("utm_campaign") ?? undefined,
        term: q.get("utm_term") ?? undefined,
        content: q.get("utm_content") ?? undefined,
      },
      lang: navigator.language,
      screen: window.innerWidth,
    });
    first.current = false;
    visible.current = 0;
    since.current = document.visibilityState === "visible" ? Date.now() : 0;

    // Time on page counts only while the tab is visible.
    const flush = () => {
      if (since.current) visible.current += Date.now() - since.current;
      since.current = 0;
      if (visible.current > 1000) send({ type: "engage", path, vid, session: session(), duration_ms: visible.current });
      visible.current = 0;
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
      else since.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (location.pathname.startsWith("/admin")) return;
      const el = (e.target as Element | null)?.closest("[data-track], a[href]");
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      const vid = who.current?.vid ?? store.get("kiln_vid");
      // Downloads are recorded by the server; hand it the visitor and session so they join the journey.
      if (href.startsWith("/api/download/") && el instanceof HTMLAnchorElement) {
        const u = new URL(el.href);
        if (vid) u.searchParams.set("v", vid);
        u.searchParams.set("s", session());
        if (ignored()) u.searchParams.delete("v"), u.searchParams.set("x", "1");
        el.href = u.toString();
      }
      let label = el.getAttribute("data-track");
      if (!label) {
        if (!/^https?:/.test(href) || href.includes(location.host)) return;
        label = `out:${href.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)}`;
      }
      send({ type: "click", path: location.pathname, label, vid, session: session() });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
