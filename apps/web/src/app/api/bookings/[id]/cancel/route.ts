import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { cancelAdminBooking, cancelBooking, cancelPartnerBooking } from "@/server/services/bookings";
import { apiError, authError, mapCancelBookingError, parseBookingId } from "../../booking-api-helpers";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["client", "partner", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    const userId = auth.userId as string;
    const result = auth.roles?.includes("admin")
      ? await cancelAdminBooking(bookingId)
      : auth.roles?.includes("partner")
        ? await cancelPartnerBooking(bookingId, userId)
        : await cancelBooking(bookingId, userId);

    return NextResponse.json({ data: result });
  } catch (error) {
    return mapCancelBookingError(error);
  }
}
