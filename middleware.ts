import { NextResponse, type NextRequest } from "next/server";

// Fast edge check: bounce anonymous visitors away from private areas.
// Real session validation and role checks happen server side in each page/action.
const PRIVATE = ["/dashboard", "/admin", "/talent", "/briefs/new"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PRIVATE.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!req.cookies.get("ain_session")) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/talent/:path*", "/briefs/new"] };
