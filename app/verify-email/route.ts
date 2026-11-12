import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/src/db";
import { consumeToken } from "@/src/lib/tokens";
import { SESSION_COOKIE } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

/** The link in the verification email lands here, confirms the address, then sends the member on. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  if (userId) await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  const signedIn = Boolean(req.cookies.get(SESSION_COOKIE));
  const url = req.nextUrl.clone();
  url.search = "";
  url.pathname = signedIn ? "/dashboard" : "/login";
  url.searchParams.set(userId ? "verified" : "verify", userId ? "1" : "expired");
  return NextResponse.redirect(url);
}
