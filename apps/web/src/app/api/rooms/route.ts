import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { authError } from "@/app/api/api-response";
import { createPartnerRoom, listPartnerRoomsForHotel } from "@/server/services/partnerRooms";
import { mapPartnerRoomError, parseRoomMutationRequest, parseRoomsQuery } from "./room-api-helpers";

export async function GET(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const hotelId = parseRoomsQuery(new URL(request.url).searchParams);
    const rooms = await listPartnerRoomsForHotel(auth.userId as string, hotelId);
    return NextResponse.json({ data: rooms });
  } catch (error) {
    return mapPartnerRoomError(error);
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const input = await parseRoomMutationRequest(request);
    const room = await createPartnerRoom(auth.userId as string, input);
    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error) {
    return mapPartnerRoomError(error);
  }
}
