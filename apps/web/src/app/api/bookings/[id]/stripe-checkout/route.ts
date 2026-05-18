import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createStripeCheckoutForBooking } from "@/server/services/bookings";
import { apiError, authError, mapStripeCheckoutError, parseBookingId } from "../../booking-api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
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
    const checkout = await createStripeCheckoutForBooking(bookingId, auth.userId as string, getAppUrl(request));
    return NextResponse.json({ data: checkout });
  } catch (error) {
    return mapStripeCheckoutError(error);
  }
}
