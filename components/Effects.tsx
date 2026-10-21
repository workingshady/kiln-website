"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Fades [data-reveal] elements in once as they enter the viewport. */
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "true");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}

/** Scroll progress shown as the kiln heating from room temperature to 1300 °C. */
export function HeatGauge() {
  const fill = useRef<HTMLDivElement>(null);
  const read = useRef<HTMLSpanElement>(null);
  const path = usePathname();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      fill.current?.style.setProperty("--p", `${(p * 100).toFixed(1)}%`);
      if (read.current) read.current.textContent = `${Math.round(20 + p * 1280)} °C`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [path]);

  if (path.startsWith("/admin")) return null;
  return (
    <div className="gauge" aria-hidden>
      <div className="gauge-tube"><div className="gauge-fill" ref={fill} /></div>
      <span className="gauge-read" ref={read}>20 °C</span>
    </div>
  );
}
