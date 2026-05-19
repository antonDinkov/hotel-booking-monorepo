import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createStripeCheckoutForBooking } from "@/server/services/bookings";
import { apiError, authError, mapStripeCheckoutError, parseBookingId } from "../../booking-api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MOBILE_SCHEME = "mobile";

function getAppUrl(request: Request, returnTo?: string, requestedAppUrl?: string): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = new URL(request.url).origin;

  if (isNativeReturnTo(returnTo)) {
    const developmentAppUrl = getDevelopmentAppUrl(requestedAppUrl);
    if (developmentAppUrl) return developmentAppUrl;
    if (configuredAppUrl && !isLoopbackAppUrl(configuredAppUrl)) return configuredAppUrl;
    if (!isLoopbackAppUrl(requestOrigin)) return requestOrigin;
  }

  return configuredAppUrl ?? requestOrigin;
}

function getDevelopmentAppUrl(appUrl?: string): string | null {
  if (process.env.NODE_ENV === "production" || !appUrl) return null;

  const normalized = normalizeHttpAppUrl(appUrl);
  if (!normalized || isLoopbackAppUrl(normalized)) return null;

  return normalized;
}

function normalizeHttpAppUrl(appUrl: string): string | null {
  try {
    const target = new URL(appUrl.trim());
    if (target.protocol !== "http:" && target.protocol !== "https:") return null;

    target.pathname = "";
    target.search = "";
    target.hash = "";

    return target.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isNativeReturnTo(returnTo?: string): boolean {
  if (!returnTo) return false;

  try {
    const protocol = new URL(returnTo).protocol;
    return protocol === "exp:" || protocol === `${process.env.MOBILE_APP_SCHEME ?? DEFAULT_MOBILE_SCHEME}:`;
  } catch {
    return false;
  }
}

function isLoopbackAppUrl(appUrl: string): boolean {
  try {
    const hostname = new URL(appUrl).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    let returnTo: string | undefined;
    let requestedAppUrl: string | undefined;

    try {
      const body = await request.json();
      if (body && typeof body === "object" && typeof (body as { returnTo?: unknown }).returnTo === "string") {
        const next = (body as { returnTo: string }).returnTo.trim();
        if (next.length > 0 && next.length < 2048) {
          returnTo = next;
        }
      }
      if (body && typeof body === "object" && typeof (body as { appUrl?: unknown }).appUrl === "string") {
        const next = (body as { appUrl: string }).appUrl.trim();
        if (next.length > 0 && next.length < 2048) {
          requestedAppUrl = next;
        }
      }
    } catch {
      // Body is optional for this endpoint.
    }

    const appUrl = getAppUrl(request, returnTo, requestedAppUrl);
    if (isNativeReturnTo(returnTo) && isLoopbackAppUrl(appUrl)) {
      return apiError(
        "Native Stripe checkout requires a LAN or public backend URL, not localhost.",
        "NATIVE_CHECKOUT_LOCALHOST_APP_URL",
        400
      );
    }

    const checkout = await createStripeCheckoutForBooking(
      bookingId,
      auth.userId as string,
      appUrl,
      returnTo
    );
    return NextResponse.json({ data: checkout });
  } catch (error) {
    return mapStripeCheckoutError(error);
  }
}
