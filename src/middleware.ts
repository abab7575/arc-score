import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const APEX_HOST = "arcreport.ai";
const CANONICAL_HOST = "www.arcreport.ai";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Canonicalize apex → www so every crawler and agent gets one clean 301.
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (host === APEX_HOST) {
    return NextResponse.redirect(
      `https://${CANONICAL_HOST}${pathname}${search}`,
      301,
    );
  }

  // Protect /admin/* pages (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protect /api/admin/* routes (except login/logout)
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login") && !pathname.startsWith("/api/admin/logout")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run everywhere except Next internals and static assets so the apex
  // redirect covers robots.txt, sitemap.xml, data downloads, and all pages.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/).*)"],
};
