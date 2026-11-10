import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, loginAttempts } from "@/src/db";

/** Records a hit for `key` and returns true if it is over `max` hits within `windowMs`. */
export async function hitRateLimit(key: string, max: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const rows = await db
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, since)))
    .limit(max);
  if (rows.length >= max) return true;
  await db.insert(loginAttempts).values({ key });
  if (Math.random() < 0.05) {
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 3600 * 1000)));
  }
  return false;
}
