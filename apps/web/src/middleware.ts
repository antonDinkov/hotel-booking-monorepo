import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dev debug logging to help trace repeated requests
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && (pathname === "/" || pathname === "/login" || pathname.startsWith("/dashboard"))) {
    const referer = req.headers.get("referer") || req.headers.get("referrer") || "(no-ref)";
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieNames = cookieHeader
      ? cookieHeader.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean).join(",")
      : "(none)";
    const secFetchMode = req.headers.get("sec-fetch-mode") || "";
    console.info(`[MW-DBG] ${new Date().toISOString()} ${req.method} ${pathname} cookies=${cookieNames} referer=${referer} sec-fetch-mode=${secFetchMode}`);
  }

  // prevent infinite loop: if already on dashboard or its subpaths, do nothing
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // consider user logged in if NextAuth session cookie exists
  const isLoggedIn = !!(
    req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token")
  );

  // If authenticated and visiting the public entry pages, redirect once to /dashboard
  if (isLoggedIn && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
