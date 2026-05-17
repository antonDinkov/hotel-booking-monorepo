import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { hotelImages } from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import { deleteImageObject, uploadHotelImage } from "@/server/lib/r2";
import type {
  PartnerImageMutationInput,
  PartnerManagedImage,
} from "@/types/partner-hotel";

type DbExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete">;

type ImageScope = {
  hotelId: number;
  roomTypeId: number | null;
};

type NormalizedImage =
  | { kind: "existing"; id: number; sortOrder: number; isCover: boolean }
  | { kind: "direct"; imageKey: string; sortOrder: number; isCover: boolean }
  | { kind: "file"; clientId: string; file: File; sortOrder: number; isCover: boolean };

type HotelImageRow = {
  id: number;
  hotelId: number;
  roomTypeId: number | null;
  imageKey: string;
  sortOrder: number;
  isCover: boolean;
};

function getScopeCondition(scope: ImageScope) {
  const roomCondition = scope.roomTypeId === null
    ? isNull(hotelImages.roomTypeId)
    : eq(hotelImages.roomTypeId, scope.roomTypeId);

  return and(eq(hotelImages.hotelId, scope.hotelId), roomCondition);
}

function mapImage(row: HotelImageRow): PartnerManagedImage {
  return {
    id: row.id,
    hotelId: row.hotelId,
    roomTypeId: row.roomTypeId,
    imageKey: row.imageKey,
    imageUrl: resolveImageUrl(row.imageKey),
    sortOrder: row.sortOrder,
    isCover: row.isCover,
  };
}

function normalizeImages(input: PartnerImageMutationInput): NormalizedImage[] {
  const images: NormalizedImage[] = [
    ...input.existingImages.map((image) => ({ kind: "existing" as const, ...image })),
    ...input.directImages.map((image) => ({ kind: "direct" as const, ...image })),
    ...input.fileImages.map((image) => ({ kind: "file" as const, ...image })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  const coverIndex = images.findIndex((image) => image.isCover);

  return images.map((image, index) => ({
    ...image,
    sortOrder: index,
    isCover: index === (coverIndex >= 0 ? coverIndex : 0),
  }));
}

async function deleteRemovedObjects(rows: HotelImageRow[]): Promise<void> {
  for (const row of rows) {
    try {
      await deleteImageObject(row.imageKey);
    } catch (error) {
      console.error("Failed to delete image object:", error);
    }
  }
}

export async function getScopedImages(scope: ImageScope): Promise<PartnerManagedImage[]> {
  const rows = await db
    .select({
      id: hotelImages.id,
      hotelId: hotelImages.hotelId,
      roomTypeId: hotelImages.roomTypeId,
      imageKey: hotelImages.imageKey,
      sortOrder: hotelImages.sortOrder,
      isCover: hotelImages.isCover,
    })
    .from(hotelImages)
    .where(getScopeCondition(scope))
    .orderBy(asc(hotelImages.sortOrder), asc(hotelImages.id));

  return rows.map(mapImage);
}

export async function syncScopedImages(
  executor: DbExecutor,
  scope: ImageScope,
  input: PartnerImageMutationInput
): Promise<PartnerManagedImage[]> {
  const normalizedImages = normalizeImages(input);
  const currentRows = await executor
    .select({
      id: hotelImages.id,
      hotelId: hotelImages.hotelId,
      roomTypeId: hotelImages.roomTypeId,
      imageKey: hotelImages.imageKey,
      sortOrder: hotelImages.sortOrder,
      isCover: hotelImages.isCover,
    })
    .from(hotelImages)
    .where(getScopeCondition(scope));

  const currentIds = new Set(currentRows.map((image) => image.id));
  const retainedIds = normalizedImages
    .filter((image) => image.kind === "existing")
    .map((image) => image.id);

  if (retainedIds.some((id) => !currentIds.has(id))) {
    throw new Error("IMAGE_NOT_FOUND");
  }

  const retainedIdSet = new Set(retainedIds);
  const removedRows = currentRows.filter((image) => !retainedIdSet.has(image.id));

  if (removedRows.length > 0) {
    await executor
      .delete(hotelImages)
      .where(inArray(hotelImages.id, removedRows.map((image) => image.id)));
  }

  for (const image of normalizedImages) {
    if (image.kind !== "existing") continue;

    await executor
      .update(hotelImages)
      .set({ sortOrder: image.sortOrder, isCover: image.isCover })
      .where(and(eq(hotelImages.id, image.id), getScopeCondition(scope)));
  }

  const insertRows = [];
  for (const image of normalizedImages) {
    if (image.kind === "existing") continue;

    const imageKey = image.kind === "file"
      ? await uploadHotelImage(scope, image.file)
      : image.imageKey;

    insertRows.push({
      hotelId: scope.hotelId,
      roomTypeId: scope.roomTypeId,
      imageKey,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
    });
  }

  if (insertRows.length > 0) {
    await executor.insert(hotelImages).values(insertRows);
  }

  await deleteRemovedObjects(removedRows);
  return getScopedImages(scope);
}
