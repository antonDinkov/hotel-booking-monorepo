import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import {
  apiError,
  authError,
  mapPartnerBookingError,
  parseBookingId,
  parsePartnerBookingStatusRequest,
} from "../booking-api-helpers";
import {
  getPartnerBookingDetails,
  updatePartnerBookingStatus,
} from "@/server/services/partnerBookings";
import type { PartnerBookingApiRouteContext } from "@/types/partner-booking";

export async function GET(
  _request: Request,
  { params }: PartnerBookingApiRouteContext
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    const booking = await getPartnerBookingDetails(auth.userId as string, bookingId);
    if (!booking) return apiError("Booking not found", "BOOKING_NOT_FOUND", 404);
    return NextResponse.json({ data: booking });
  } catch (error) {
    return mapPartnerBookingError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: PartnerBookingApiRouteContext
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const bookingId = parseBookingId(id);
  if (!bookingId) return apiError("Invalid booking ID", "INVALID_BOOKING_ID", 400);

  try {
    const input = await parsePartnerBookingStatusRequest(request);
    const result = await updatePartnerBookingStatus(
      auth.userId as string,
      bookingId,
      input.status
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return mapPartnerBookingError(error);
  }
}
