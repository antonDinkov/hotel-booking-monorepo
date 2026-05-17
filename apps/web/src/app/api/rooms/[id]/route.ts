import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { apiError, authError, parsePositiveInteger } from "@/app/api/api-response";
import { deletePartnerRoom, getPartnerRoom, updatePartnerRoom } from "@/server/services/partnerRooms";
import { mapPartnerRoomError, parseRoomMutationRequest } from "../room-api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const roomId = parsePositiveInteger(id);
  if (!roomId) return apiError("Invalid room ID", "INVALID_ROOM_ID", 400);

  try {
    const room = await getPartnerRoom(auth.userId as string, roomId);
    if (!room) return apiError("Room type not found", "ROOM_NOT_FOUND", 404);
    return NextResponse.json({ data: room });
  } catch (error) {
    return mapPartnerRoomError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const roomId = parsePositiveInteger(id);
  if (!roomId) return apiError("Invalid room ID", "INVALID_ROOM_ID", 400);

  try {
    const input = await parseRoomMutationRequest(request);
    const room = await updatePartnerRoom(auth.userId as string, roomId, input);
    return NextResponse.json({ data: room });
  } catch (error) {
    return mapPartnerRoomError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const roomId = parsePositiveInteger(id);
  if (!roomId) return apiError("Invalid room ID", "INVALID_ROOM_ID", 400);

  try {
    const deleted = await deletePartnerRoom(auth.userId as string, roomId);
    return NextResponse.json({ data: deleted });
  } catch (error) {
    return mapPartnerRoomError(error);
  }
}
