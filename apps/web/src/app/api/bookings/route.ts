import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createPendingBookingHold, getBookings, getHotelPaymentMethods } from "@/server/services/bookings";
import { apiError, authError, mapCreateBookingError, parseCreateBookingHoldBody } from "./booking-api-helpers";

export async function GET(request?: Request) {
  const auth = await authorizeApi(["client", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const hotelIdParam = request ? new URL(request.url).searchParams.get("hotelId") : null;
  if (hotelIdParam) {
    const hotelId = Number(hotelIdParam);
    if (!Number.isInteger(hotelId) || hotelId < 1) return apiError("Invalid hotel ID", "INVALID_HOTEL_ID", 400);

    const methods = await getHotelPaymentMethods(hotelId);
    return NextResponse.json({ data: { methods } });
  }

  const bookings = await getBookings(auth.userId as string);
  return NextResponse.json({ data: bookings });
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["client", "admin"]);
  if (!auth.ok) return authError(auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const parsed = parseCreateBookingHoldBody(body);
  if (!parsed.success) return apiError("Missing or invalid required fields", "VALIDATION_ERROR", 400);

  try {
    const booking = await createPendingBookingHold({ userId: auth.userId as string, ...parsed.data });
    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return mapCreateBookingError(error);
  }
}
