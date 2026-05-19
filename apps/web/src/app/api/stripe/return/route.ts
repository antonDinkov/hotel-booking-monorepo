import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MOBILE_SCHEME = "mobile";

function getMobileProtocol(): string {
  return `${process.env.MOBILE_APP_SCHEME ?? DEFAULT_MOBILE_SCHEME}:`;
}

function getConfiguredHttpOrigins(requestUrl: URL): Set<string> {
  const origins = new Set([requestUrl.origin]);
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    try {
      origins.add(new URL(configuredAppUrl).origin);
    } catch {
      // Ignore invalid deployment config and fall back to the request origin.
    }
  }

  return origins;
}

function isLocalDevelopmentTarget(target: URL): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return target.hostname === "localhost" || target.hostname === "127.0.0.1" || target.hostname === "::1";
}

function isAllowedRedirect(target: URL, requestUrl: URL): boolean {
  if (target.protocol === "exp:" || target.protocol === getMobileProtocol()) {
    return true;
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return false;
  }

  return getConfiguredHttpOrigins(requestUrl).has(target.origin) || isLocalDevelopmentTarget(target);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const bookingId = requestUrl.searchParams.get("bookingId");
  const stripe = requestUrl.searchParams.get("stripe");
  const sessionId = requestUrl.searchParams.get("session_id");
  const returnTo = requestUrl.searchParams.get("returnTo");

  const fallback = new URL(requestUrl.origin);
  if (bookingId) {
    fallback.pathname = `/bookings/${encodeURIComponent(bookingId)}/confirmation`;
    if (stripe) fallback.searchParams.set("stripe", stripe);
    if (sessionId) fallback.searchParams.set("session_id", sessionId);
  }

  if (!returnTo) {
    return NextResponse.redirect(fallback.toString(), 302);
  }

  let target: URL;
  try {
    target = new URL(returnTo);
  } catch {
    return NextResponse.redirect(fallback.toString(), 302);
  }

  if (!isAllowedRedirect(target, requestUrl)) {
    return NextResponse.redirect(fallback.toString(), 302);
  }

  if (bookingId) target.searchParams.set("bookingId", bookingId);
  if (stripe) target.searchParams.set("stripe", stripe);
  if (sessionId) target.searchParams.set("session_id", sessionId);

  return NextResponse.redirect(target.toString(), 302);
}
