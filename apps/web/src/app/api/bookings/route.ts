import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createPendingBookingHold, getBookings, getClientBookingsPage, getHotelPaymentMethods } from "@/server/services/bookings";
import {
  apiError,
  authError,
  mapAdminBookingError,
  mapCreateBookingError,
  mapPartnerBookingError,
  parseAdminBookingQuery,
  parseCreateBookingHoldBody,
  parsePartnerBookingQuery,
} from "./booking-api-helpers";

export async function GET(request?: Request) {
  const auth = await authorizeApi(["client", "partner", "admin"]);
  if (!auth.ok) return authError(auth.status);

  const searchParams = request ? new URL(request.url).searchParams : new URLSearchParams();
  if (auth.roles?.includes("admin")) {
    try {
      const filters = parseAdminBookingQuery(searchParams);
      const { listAdminBookings } = await import("@/server/services/adminBookings");
      const result = await listAdminBookings(filters);
      return NextResponse.json({ data: result });
    } catch (error) {
      return mapAdminBookingError(error);
    }
  }

  if (auth.roles?.includes("partner")) {
    try {
      const filters = parsePartnerBookingQuery(searchParams);
      const { listPartnerBookings } = await import("@/server/services/partnerBookings");
      const result = await listPartnerBookings(auth.userId as string, filters);
      return NextResponse.json({ data: result });
    } catch (error) {
      return mapPartnerBookingError(error);
    }
  }

  const hotelIdParam = searchParams.get("hotelId");
  if (hotelIdParam) {
    const hotelId = Number(hotelIdParam);
    if (!Number.isInteger(hotelId) || hotelId < 1) return apiError("Invalid hotel ID", "INVALID_HOTEL_ID", 400);

    const methods = await getHotelPaymentMethods(hotelId);
    return NextResponse.json({ data: { methods } });
  }

  const pageParam = Number(searchParams.get("page"));
  const pageSizeParam = Number(searchParams.get("pageSize"));
  if (Number.isInteger(pageParam) || Number.isInteger(pageSizeParam)) {
    const result = await getClientBookingsPage(auth.userId as string, {
      page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
      pageSize: Number.isInteger(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : undefined,
    });
    return NextResponse.json({ data: result });
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
