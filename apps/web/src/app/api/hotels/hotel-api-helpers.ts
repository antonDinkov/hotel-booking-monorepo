import { hotelMutationPayloadSchema } from "@/lib/partner-hotel-validation";
import type {
  PartnerFileImageInput,
  PartnerHotelMutationInput,
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

export async function parseHotelMutationRequest(
  request: Request
): Promise<PartnerHotelMutationInput> {
  const { payload, files } = await readMutationPayload(request);
  const parsed = hotelMutationPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR");
  }

  return {
    name: parsed.data.name,
    location: parsed.data.location,
    description: parsed.data.description ?? null,
    paymentMethods: parsed.data.paymentMethods,
    images: {
      existingImages: parsed.data.images.existingImages,
      directImages: parsed.data.images.directImages,
      fileImages: buildFileImages(parsed.data.images.fileImages, files),
    },
  };
}

export function mapPartnerHotelError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid hotel fields", code, 400);
  }
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "MISSING_PAYLOAD") return apiError("Missing form payload", code, 400);
  if (code === "MISSING_IMAGE_FILE") return apiError("Missing uploaded image file", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") return apiError("Partner profile not found", code, 403);
  if (code === "HOTEL_NOT_FOUND") return apiError("Hotel not found", code, 404);
  if (code === "IMAGE_NOT_FOUND") return apiError("Image not found", code, 404);
  if (code === "HOTEL_HAS_DEPENDENCIES") {
    return apiError("Hotel has bookings or reviews and cannot be deleted", code, 400);
  }
  if (code === "Unsupported image format" || code === "Unsupported file extension" || code === "File too large") {
    return apiError(code, "INVALID_IMAGE_FILE", 400);
  }

  console.error("Partner hotel API error:", error);
  return apiError("Partner hotel request failed", "PARTNER_HOTEL_REQUEST_FAILED", 500);
}
