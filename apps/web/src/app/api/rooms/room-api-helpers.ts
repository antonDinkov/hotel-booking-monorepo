import { roomMutationPayloadSchema, roomQuerySchema } from "@/lib/partner-hotel-validation";
import type {
  PartnerFileImageInput,
  PartnerRoomMutationInput,
} from "@/types/partner-hotel";
import { apiError } from "../api-response";
import { readMutationPayload } from "../mutation-payload";

function buildFileImages(
  metas: Array<{ clientId: string; sortOrder: number; isCover: boolean }>,
  files: Map<string, File>
): PartnerFileImageInput[] {
  return metas.map((meta) => {
    const file = files.get(meta.clientId);
    if (!file) throw new Error("MISSING_IMAGE_FILE");
    return { ...meta, file };
  });
}

export function parseRoomsQuery(searchParams: URLSearchParams): number {
  const parsed = roomQuerySchema.safeParse({
    hotelId: searchParams.get("hotelId"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data.hotelId;
}

export async function parseRoomMutationRequest(
  request: Request
): Promise<PartnerRoomMutationInput> {
  const { payload, files } = await readMutationPayload(request);
  const parsed = roomMutationPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR");
  }

  return {
    hotelId: parsed.data.hotelId,
    name: parsed.data.name,
    capacity: parsed.data.capacity,
    pricePerNight: parsed.data.pricePerNight,
    totalRooms: parsed.data.totalRooms,
    images: {
      existingImages: parsed.data.images.existingImages,
      directImages: parsed.data.images.directImages,
      fileImages: buildFileImages(parsed.data.images.fileImages, files),
    },
  };
}

export function mapPartnerRoomError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid room fields", code, 400);
  }
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "MISSING_PAYLOAD") return apiError("Missing form payload", code, 400);
  if (code === "MISSING_IMAGE_FILE") return apiError("Missing uploaded image file", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") return apiError("Partner profile not found", code, 403);
  if (code === "HOTEL_NOT_FOUND") return apiError("Hotel not found", code, 404);
  if (code === "ROOM_NOT_FOUND") return apiError("Room type not found", code, 404);
  if (code === "ROOM_HOTEL_MISMATCH") return apiError("Room does not belong to this hotel", code, 400);
  if (code === "IMAGE_NOT_FOUND") return apiError("Image not found", code, 404);
  if (code === "ROOM_HAS_BOOKINGS") {
    return apiError("Room type has bookings and cannot be deleted", code, 400);
  }
  if (code === "Unsupported image format" || code === "Unsupported file extension" || code === "File too large") {
    return apiError(code, "INVALID_IMAGE_FILE", 400);
  }

  console.error("Partner room API error:", error);
  return apiError("Partner room request failed", "PARTNER_ROOM_REQUEST_FAILED", 500);
}
