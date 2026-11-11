import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, sessions, users, loginAttempts, type User, type Role } from "@/src/db";

export const SESSION_COOKIE = "ain_session";
const SESSION_DAYS = 30;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export type SafeUser = Omit<User, "passwordHash">;

/** Returns the signed-in user, or null. Never throws for anonymous visitors. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0]?.user;
  if (!u || u.suspended) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = u;
  return safe;
}

/** Page/action guard: requires a session and (optionally) one of the given roles. */
export async function requireUser(roles?: Role[]): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role) && user.role !== "ADMIN") redirect("/dashboard?denied=1");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard?denied=1");
  return user;
}

// ---- brute force protection: 8 failed attempts per email/IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function isRateLimited(email: string) {
  const ip = await clientIp();
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([countKey("e:" + email, since), countKey("i:" + ip, since)]);
  return byEmail >= MAX_ATTEMPTS || byIp >= MAX_ATTEMPTS * 4;
}
async function countKey(key: string, since: Date) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, since)));
  return row?.n ?? 0;
}
export async function recordFailedLogin(email: string) {
  const ip = await clientIp();
  await db.insert(loginAttempts).values([{ key: "e:" + email }, { key: "i:" + ip }]);
  // opportunistic cleanup
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - WINDOW_MS * 4)));
}
export async function clearFailedLogins(email: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, "e:" + email));
}

export const ROLE_LABEL: Record<Role, string> = {
  BUILDER: "Builder",
  ORGANISATION: "Organisation",
  PARTNER: "Community partner",
  ADMIN: "Administrator",
};
