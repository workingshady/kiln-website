"use client";

import { useState } from "react";
import { useOS } from "./Download";

/** Release sign-up. Stores the email only; the visitor id ties it to how they found the site. */
export function LeadForm({ from }: { from: string }) {
  const os = useOS();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    const q = new URLSearchParams(location.search);
    let vid: string | null = null;
    try { vid = localStorage.getItem("kiln_vid"); } catch {}
    const res = await fetch("/api/lead", {
      method: "POST",
      body: JSON.stringify({
        email: f.get("email"),
        website: f.get("website"),
        platform: os === "windows" || os === "mac" || os === "linux" ? os : "any",
        path: from,
        vid,
        utm_source: q.get("utm_source") ?? q.get("ref"),
        utm_campaign: q.get("utm_campaign"),
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && data.ok) setState("done");
    else { setState("error"); setMsg(data.error ?? "Couldn't reach the server. Try again."); }
  }

  if (state === "done")
    return <p className="lead-done" role="status">You&apos;re on the list. We&apos;ll email you once, when the build is out.</p>;

  return (
    <form className="lead" onSubmit={submit} noValidate>
      <label htmlFor="lead-email">Get one email when the next build is released</label>
      <div className="lead-row">
        <input id="lead-email" name="email" type="email" required autoComplete="email" placeholder="you@studio.com" aria-invalid={state === "error"} />
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
        <button className="btn" type="submit" disabled={state === "sending"} data-track={`lead-submit:${from}`}>
          {state === "sending" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {state === "error" ? <p className="lead-err" role="alert">{msg}</p> : <p className="lead-note">Used only to tell you about the release. No newsletter.</p>}
    </form>
  );
}
