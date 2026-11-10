import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __db?: DB };

// Connect lazily so `next build` works without a database; the first real query opens the pool.
function getDb(): DB {
  if (g.__db) return g.__db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it in your Vercel project settings.");
  // prepare:false keeps us compatible with pooled connections (Neon, Supabase pooler)
  g.__db = drizzle(postgres(url, { max: 5, prepare: false }), { schema });
  return g.__db;
}

export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export * from "./schema";
