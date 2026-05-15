import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { confirmCashOnArrivalBooking } from "@/server/services/bookings";
import { apiError, authError, mapCashOnArrivalError, parseBookingId } from "../../booking-api-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["client", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    const booking = await confirmCashOnArrivalBooking(bookingId, auth.userId as string);
    return NextResponse.json({ data: booking });
  } catch (error) {
    return mapCashOnArrivalError(error);
  }
}
