import { NextResponse, type NextRequest } from "next/server";
import { AUDIENCE_COOKIE, AUDIENCES, audienceForPath, isAudience } from "@/src/lib/audience";

// Fast edge checks. Real session validation and role checks happen server side in each page/action.
const PRIVATE = ["/dashboard", "/admin", "/talent", "/briefs/new"];
const YEAR = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  const { pathname, search, searchParams } = req.nextUrl;

  // Private areas: bounce anonymous visitors to sign in.
  if (PRIVATE.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!req.cookies.get("ain_session")) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Homepage: "/?choose=1" forgets the remembered audience and shows the chooser.
  if (pathname === "/") {
    if (searchParams.has("choose")) {
      const res = NextResponse.next();
      res.cookies.delete(AUDIENCE_COOKIE);
      return res;
    }
    // Returning anonymous visitors go straight to their own page.
    // (Signed-in members are routed by role on the page itself, after their session is checked.)
    const aud = req.cookies.get(AUDIENCE_COOKIE)?.value;
    if (!req.cookies.get("ain_session") && isAudience(aud)) {
      const url = req.nextUrl.clone();
      url.pathname = AUDIENCES[aud].path;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Audience pages: remember who this visitor is.
  const aud = audienceForPath(pathname);
  if (aud) {
    const res = NextResponse.next();
    if (req.cookies.get(AUDIENCE_COOKIE)?.value !== aud) {
      res.cookies.set(AUDIENCE_COOKIE, aud, { path: "/", maxAge: YEAR, sameSite: "lax", secure: req.nextUrl.protocol === "https:" });
    }
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/builders", "/employers", "/partners", "/dashboard/:path*", "/admin/:path*", "/talent/:path*", "/briefs/new"],
};
