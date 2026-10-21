import { NextResponse } from "next/server";
import { checkCredentials, COOKIE, makeSession } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const user = String(form.get("username") ?? "");
  const pass = String(form.get("password") ?? "");
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);

  if (!checkCredentials(user, pass)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return back("/admin/login?error=1");
  }
  const s = makeSession();
  const res = back("/admin");
  res.cookies.set(COOKIE, s.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: s.maxAge,
  });
  return res;
}
