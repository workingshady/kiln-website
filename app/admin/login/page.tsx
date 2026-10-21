import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const ready = adminConfigured();

  return (
    <section className="login">
      <form className="login-card" method="post" action="/api/admin/login">
        <LogoMark size={44} />
        <h1>Kiln control room</h1>
        {!ready && (
          <p className="login-err" role="alert">
            Admin login isn&apos;t configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SECRET (16+ characters) in the environment.
          </p>
        )}
        {error && <p className="login-err" role="alert">That username and password don&apos;t match.</p>}
        <label>
          Username
          <input name="username" autoComplete="username" required autoFocus />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-fire" type="submit" disabled={!ready}>Sign in</button>
      </form>
    </section>
  );
}
