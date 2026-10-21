import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "kiln_admin";
const MAX_AGE = 60 * 60 * 12; // 12 h

const secret = () => process.env.ADMIN_SECRET ?? "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const adminConfigured = () =>
  Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && secret().length >= 16);

export function checkCredentials(user: string, pass: string) {
  if (!adminConfigured()) return false;
  // Compare both, always, so timing doesn't reveal which one was wrong.
  const u = safeEqual(user, process.env.ADMIN_USERNAME!);
  const p = safeEqual(pass, process.env.ADMIN_PASSWORD!);
  return u && p;
}

export function makeSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return { value: `${exp}.${sign(exp)}`, maxAge: MAX_AGE };
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, mac] = v.split(".");
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
