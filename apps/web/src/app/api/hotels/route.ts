import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { authError } from "@/app/api/api-response";
import { createPartnerHotel, listPartnerHotels } from "@/server/services/partnerHotels";
import { mapPartnerHotelError, parseHotelMutationRequest } from "./hotel-api-helpers";

export async function GET() {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const hotels = await listPartnerHotels(auth.userId as string);
    return NextResponse.json({ data: hotels });
  } catch (error) {
    return mapPartnerHotelError(error);
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const input = await parseHotelMutationRequest(request);
    const hotel = await createPartnerHotel(auth.userId as string, input);
    return NextResponse.json({ data: hotel }, { status: 201 });
  } catch (error) {
    return mapPartnerHotelError(error);
  }
}
