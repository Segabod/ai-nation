import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db, authTokens, users } from "@/src/db";
import { appUrl, sendEmail, templates } from "@/src/lib/email";

type Kind = "VERIFY_EMAIL" | "RESET_PASSWORD";
const TTL: Record<Kind, number> = { VERIFY_EMAIL: 48 * 3600e3, RESET_PASSWORD: 3600e3 };
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Creates a fresh single-use token; any earlier unused token of the same kind stops working. */
async function issue(userId: string, kind: Kind) {
  const token = randomBytes(32).toString("base64url");
  await db.delete(authTokens).where(
    or(
      and(eq(authTokens.userId, userId), eq(authTokens.kind, kind)),
      lt(authTokens.expiresAt, new Date(Date.now() - 7 * 864e5)), // opportunistic cleanup
    ),
  );
  await db.insert(authTokens).values({ userId, kind, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL[kind]) });
  return token;
}

/** Marks a token used and returns its user id, or null if it is unknown, expired or already used. */
export async function consumeToken(token: string, kind: Kind): Promise<string | null> {
  if (!token || token.length > 100) return null;
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.tokenHash, sha256(token)), eq(authTokens.kind, kind), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .returning({ userId: authTokens.userId });
  return row?.userId ?? null;
}

/** Checks a token without using it (to decide whether to show the reset form). */
export async function peekToken(token: string, kind: Kind) {
  if (!token || token.length > 100) return false;
  const row = await db.query.authTokens.findFirst({
    where: and(eq(authTokens.tokenHash, sha256(token)), eq(authTokens.kind, kind), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())),
    columns: { id: true },
  });
  return Boolean(row);
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = await issue(user.id, "VERIFY_EMAIL");
  return sendEmail(templates.verifyEmail(user.email, user.name, `${appUrl()}/verify-email?token=${token}`));
}

export async function sendPasswordResetEmail(email: string) {
  const u = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true, email: true, name: true, suspended: true } });
  if (!u || u.suspended) return; // say nothing: the response is the same either way
  const token = await issue(u.id, "RESET_PASSWORD");
  await sendEmail(templates.resetPassword(u.email, u.name, `${appUrl()}/reset-password?token=${token}`));
}
