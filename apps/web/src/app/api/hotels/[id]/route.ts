import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { apiError, authError, parsePositiveInteger } from "@/app/api/api-response";
import {
  deletePartnerHotel,
  getPartnerHotelDetails,
  updatePartnerHotel,
} from "@/server/services/partnerHotels";
import { getListingById } from "@/server/services/hotelPanel";
import { mapPartnerHotelError, parseHotelMutationRequest } from "../hotel-api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);

  const { id } = await params;
  const hotelId = parsePositiveInteger(id);
  if (!hotelId) return apiError("Invalid hotel ID", "INVALID_HOTEL_ID", 400);

  if (!auth.ok) {
    const listing = await getListingById(hotelId);
    if (!listing) return apiError("Hotel not found", "HOTEL_NOT_FOUND", 404);
    return NextResponse.json({ data: listing });
  }

  try {
    const hotel = await getPartnerHotelDetails(auth.userId as string, hotelId);
    if (!hotel) return apiError("Hotel not found", "HOTEL_NOT_FOUND", 404);
    return NextResponse.json({ data: hotel });
  } catch (error) {
    return mapPartnerHotelError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const hotelId = parsePositiveInteger(id);
  if (!hotelId) return apiError("Invalid hotel ID", "INVALID_HOTEL_ID", 400);

  try {
    const input = await parseHotelMutationRequest(request);
    const hotel = await updatePartnerHotel(auth.userId as string, hotelId, input);
    return NextResponse.json({ data: hotel });
  } catch (error) {
    return mapPartnerHotelError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const hotelId = parsePositiveInteger(id);
  if (!hotelId) return apiError("Invalid hotel ID", "INVALID_HOTEL_ID", 400);

  try {
    const deleted = await deletePartnerHotel(auth.userId as string, hotelId);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return mapPartnerHotelError(error);
  }
}
