"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function send(data: Record<string, unknown>) {
  const body = JSON.stringify(data);
  if (navigator.sendBeacon?.("/api/track", body)) return;
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

function session() {
  try {
    let s = sessionStorage.getItem("kiln_s");
    if (!s) sessionStorage.setItem("kiln_s", (s = Math.random().toString(36).slice(2, 12)));
    return s;
  } catch {
    return null;
  }
}

/** Page views, time on page, and clicks on anything marked data-track (plus outbound links). */
export function Tracker() {
  const path = usePathname();
  const started = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const q = new URLSearchParams(location.search);
    send({
      type: "pageview",
      path,
      session: session(),
      // Only the landing view carries the external referrer.
      referrer: first.current ? document.referrer || "(direct)" : null,
      utm: {
        source: q.get("utm_source") ?? q.get("ref") ?? undefined,
        medium: q.get("utm_medium") ?? undefined,
        campaign: q.get("utm_campaign") ?? undefined,
      },
    });
    first.current = false;
    started.current = Date.now();

    const engage = () => {
      const ms = Date.now() - started.current;
      if (ms > 1000) send({ type: "engage", path, session: session(), duration_ms: ms });
      started.current = Date.now();
    };
    const onHide = () => document.visibilityState === "hidden" && engage();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      engage();
    };
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (location.pathname.startsWith("/admin")) return;
      const el = (e.target as Element | null)?.closest("[data-track], a[href^='http']");
      if (!el) return;
      let label = el.getAttribute("data-track");
      if (!label) {
        const href = el.getAttribute("href") ?? "";
        if (href.includes(location.host)) return;
        label = `out:${href.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)}`;
      }
      send({ type: "click", path: location.pathname, label, session: session() });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
