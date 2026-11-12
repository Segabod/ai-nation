// Runs at build time on Vercel: applies pending SQL migrations from ./drizzle
// and creates the first admin account if ADMIN_EMAIL / ADMIN_PASSWORD are set.
// Safe to run on every deploy: migrations are tracked, and an existing admin is never overwritten.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No database URL set, skipping migrations.");
  process.exit(0);
}
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Schema is up to date.");

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password.length >= 10) {
    const hash = await bcrypt.hash(password, 12);
    const res = await sql`
      insert into users (id, email, password_hash, name, role, organisation, email_verified_at)
      values (${randomUUID()}, ${email}, ${hash}, 'AI Nation Admin', 'ADMIN', 'AI Nation', now())
      on conflict (email) do nothing returning id`;
    console.log(res.length ? `[migrate] Created admin ${email}.` : `[migrate] Admin ${email} already exists, left unchanged.`);
  }
} finally {
  await sql.end();
}
