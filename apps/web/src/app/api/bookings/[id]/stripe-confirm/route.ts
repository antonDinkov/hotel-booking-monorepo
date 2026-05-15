import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { confirmStripeCheckoutSessionForBooking } from "@/server/services/bookings";
import {
  apiError,
  authError,
  mapStripeConfirmationError,
  parseBookingId,
  parseConfirmStripeSessionBody,
} from "../../booking-api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["client", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const parsed = parseConfirmStripeSessionBody(body);
  if (!parsed.success) return apiError("Invalid Stripe session ID", "VALIDATION_ERROR", 400);

  try {
    const result = await confirmStripeCheckoutSessionForBooking(
      bookingId,
      parsed.data.sessionId,
      auth.userId as string
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return mapStripeConfirmationError(error);
  }
}
