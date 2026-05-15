import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { cancelBooking } from "@/server/services/bookings";
import { apiError, authError, mapCancelBookingError, parseBookingId } from "../../booking-api-helpers";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["client", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    const result = await cancelBooking(bookingId, auth.userId as string);
    return NextResponse.json({ data: result });
  } catch (error) {
    return mapCancelBookingError(error);
  }
}
