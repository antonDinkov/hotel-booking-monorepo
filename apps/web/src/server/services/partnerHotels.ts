import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotelImages,
  hotelPaymentMethods,
  hotels,
  partners,
  reviews,
  roomTypes,
} from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import { deleteImageObject } from "@/server/lib/r2";
import { getScopedImages, syncScopedImages } from "@/server/services/partnerImages";
import type {
  PartnerHotelDetails,
  PartnerHotelMutationInput,
  PartnerHotelSummary,
  PartnerManagedImage,
  PartnerPaymentMethod,
  PartnerRoomType,
} from "@/types/partner-hotel";

const PAYMENT_METHODS: PartnerPaymentMethod[] = ["stripe", "cash_on_arrival"];

type HotelRecord = {
  id: number;
  name: string;
  location: string;
  description: string | null;
};

type RoomRecord = {
  id: number;
  hotelId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
};

function isPartnerPaymentMethod(value: string): value is PartnerPaymentMethod {
  return PAYMENT_METHODS.includes(value as PartnerPaymentMethod);
}

function normalizeDescription(value: string | null | undefined): string | null {
  const description = value?.trim();
  return description ? description : null;
}

function getCoverImage(images: PartnerManagedImage[]): string | null {
  const cover = images.find((image) => image.isCover) ?? images[0];
  return cover?.imageUrl ?? null;
}

function mapRoom(row: RoomRecord, images: PartnerManagedImage[]): PartnerRoomType {
  return {
    id: row.id,
    hotelId: row.hotelId,
    name: row.name,
    capacity: row.capacity,
    pricePerNight: row.pricePerNight,
    totalRooms: row.totalRooms,
    existingRoomsCount: row.totalRooms,
    images,
  };
}

async function getPaymentMethods(hotelId: number): Promise<PartnerPaymentMethod[]> {
  const rows = await db
    .select({ method: hotelPaymentMethods.method })
    .from(hotelPaymentMethods)
    .where(eq(hotelPaymentMethods.hotelId, hotelId));

  return rows.map((row) => row.method).filter(isPartnerPaymentMethod);
}

async function replacePaymentMethods(
  tx: Pick<typeof db, "delete" | "insert">,
  hotelId: number,
  methods: PartnerPaymentMethod[]
): Promise<void> {
  await tx.delete(hotelPaymentMethods).where(eq(hotelPaymentMethods.hotelId, hotelId));

  const uniqueMethods = [...new Set(methods)];
  if (uniqueMethods.length === 0) return;

  await tx.insert(hotelPaymentMethods).values(
    uniqueMethods.map((method) => ({ hotelId, method }))
  );
}

async function getRoomsForHotel(hotelId: number): Promise<PartnerRoomType[]> {
  const rows = await db
    .select({
      id: roomTypes.id,
      hotelId: roomTypes.hotelId,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerNight: roomTypes.pricePerNight,
      totalRooms: roomTypes.totalRooms,
    })
    .from(roomTypes)
    .where(eq(roomTypes.hotelId, hotelId))
    .orderBy(asc(roomTypes.id));

  const imagesByRoomId = await getRoomImagesByRoomId(rows.map((room) => room.id));
  return rows.map((room) => mapRoom(room, imagesByRoomId.get(room.id) ?? []));
}

async function getRoomImagesByRoomId(roomIds: number[]): Promise<Map<number, PartnerManagedImage[]>> {
  if (roomIds.length === 0) return new Map();

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
    .where(inArray(hotelImages.roomTypeId, roomIds))
    .orderBy(asc(hotelImages.sortOrder), asc(hotelImages.id));

  const imagesByRoomId = new Map<number, PartnerManagedImage[]>();
  for (const row of rows) {
    if (row.roomTypeId === null) continue;

    const images = imagesByRoomId.get(row.roomTypeId) ?? [];
    images.push({
      ...row,
      imageUrl: resolveImageUrl(row.imageKey),
    });
    imagesByRoomId.set(row.roomTypeId, images);
  }

  return imagesByRoomId;
}

async function getCoverImagesByHotelId(hotelIds: number[]): Promise<Map<number, string>> {
  if (hotelIds.length === 0) return new Map();

  const rows = await db
    .select({
      hotelId: hotelImages.hotelId,
      imageKey: hotelImages.imageKey,
    })
    .from(hotelImages)
    .where(and(inArray(hotelImages.hotelId, hotelIds), isNull(hotelImages.roomTypeId)))
    .orderBy(desc(hotelImages.isCover), asc(hotelImages.sortOrder), asc(hotelImages.id));

  const coverImages = new Map<number, string>();
  for (const row of rows) {
    if (!coverImages.has(row.hotelId)) {
      coverImages.set(row.hotelId, resolveImageUrl(row.imageKey));
    }
  }

  return coverImages;
}

async function getRoomTypeCountsByHotelId(hotelIds: number[]): Promise<Map<number, number>> {
  if (hotelIds.length === 0) return new Map();

  const rows = await db
    .select({
      hotelId: roomTypes.hotelId,
      roomTypeCount: sql<number>`count(*)::int`,
    })
    .from(roomTypes)
    .where(inArray(roomTypes.hotelId, hotelIds))
    .groupBy(roomTypes.hotelId);

  return new Map(rows.map((row) => [row.hotelId, Number(row.roomTypeCount)]));
}

async function getHotelRecordForPartner(
  partnerId: string,
  hotelId: number
): Promise<HotelRecord | null> {
  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      description: hotels.description,
    })
    .from(hotels)
    .where(and(eq(hotels.id, hotelId), eq(hotels.partnerId, partnerId)))
    .then((rows) => rows[0] ?? null);
}

async function deleteImageObjectsForHotel(hotelId: number): Promise<void> {
  const rows = await db
    .select({ imageKey: hotelImages.imageKey })
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotelId));

  for (const row of rows) {
    try {
      await deleteImageObject(row.imageKey);
    } catch (error) {
      console.error("Failed to delete hotel image object:", error);
    }
  }
}

async function hasHotelDependencies(hotelId: number): Promise<boolean> {
  const bookingRow = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .where(eq(roomTypes.hotelId, hotelId))
    .then((rows) => rows[0]);

  const reviewRow = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.hotelId, hotelId))
    .then((rows) => rows[0]);

  return Number(bookingRow?.value ?? 0) > 0 || Number(reviewRow?.value ?? 0) > 0;
}

export async function getPartnerIdForUser(userId: string): Promise<string> {
  const partner = await db
    .select({ id: partners.id })
    .from(partners)
    .where(eq(partners.userId, userId))
    .then((rows) => rows[0]);

  if (!partner) {
    throw new Error("PARTNER_PROFILE_NOT_FOUND");
  }

  return partner.id;
}

export async function assertPartnerOwnsHotel(
  userId: string,
  hotelId: number
): Promise<HotelRecord> {
  const partnerId = await getPartnerIdForUser(userId);
  const hotel = await getHotelRecordForPartner(partnerId, hotelId);

  if (!hotel) {
    throw new Error("HOTEL_NOT_FOUND");
  }

  return hotel;
}

export async function listPartnerHotels(userId: string): Promise<PartnerHotelSummary[]> {
  const partnerId = await getPartnerIdForUser(userId);
  const hotelRows = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      description: hotels.description,
    })
    .from(hotels)
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(desc(hotels.registeredAt), desc(hotels.id));

  const hotelIds = hotelRows.map((hotel) => hotel.id);
  const [coverImages, roomTypeCounts] = await Promise.all([
    getCoverImagesByHotelId(hotelIds),
    getRoomTypeCountsByHotelId(hotelIds),
  ]);

  return hotelRows.map((hotel) => ({
    ...hotel,
    coverImageUrl: coverImages.get(hotel.id) ?? null,
    roomTypeCount: roomTypeCounts.get(hotel.id) ?? 0,
  }));
}

export async function getPartnerHotelDetails(
  userId: string,
  hotelId: number
): Promise<PartnerHotelDetails | null> {
  const partnerId = await getPartnerIdForUser(userId);
  const hotel = await getHotelRecordForPartner(partnerId, hotelId);
  if (!hotel) return null;

  const [images, paymentMethods, rooms] = await Promise.all([
    getScopedImages({ hotelId, roomTypeId: null }),
    getPaymentMethods(hotelId),
    getRoomsForHotel(hotelId),
  ]);

  return {
    ...hotel,
    coverImageUrl: getCoverImage(images),
    roomTypeCount: rooms.length,
    images,
    paymentMethods,
    rooms,
  };
}

export async function createPartnerHotel(
  userId: string,
  input: PartnerHotelMutationInput
): Promise<PartnerHotelDetails> {
  const partnerId = await getPartnerIdForUser(userId);
  const hotel = await db.transaction(async (tx) => {
    const [createdHotel] = await tx
      .insert(hotels)
      .values({
        name: input.name,
        location: input.location,
        description: normalizeDescription(input.description),
        partnerId,
      })
      .returning({
        id: hotels.id,
        name: hotels.name,
        location: hotels.location,
        description: hotels.description,
      });

    await replacePaymentMethods(tx, createdHotel.id, input.paymentMethods);
    await syncScopedImages(tx, { hotelId: createdHotel.id, roomTypeId: null }, input.images);

    return createdHotel;
  });

  const details = await getPartnerHotelDetails(userId, hotel.id);
  if (!details) throw new Error("HOTEL_NOT_FOUND");
  return details;
}

export async function updatePartnerHotel(
  userId: string,
  hotelId: number,
  input: PartnerHotelMutationInput
): Promise<PartnerHotelDetails> {
  await assertPartnerOwnsHotel(userId, hotelId);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(hotels)
      .set({
        name: input.name,
        location: input.location,
        description: normalizeDescription(input.description),
      })
      .where(eq(hotels.id, hotelId))
      .returning({ id: hotels.id });

    if (updated.length === 0) {
      throw new Error("HOTEL_NOT_FOUND");
    }

    await replacePaymentMethods(tx, hotelId, input.paymentMethods);
    await syncScopedImages(tx, { hotelId, roomTypeId: null }, input.images);
  });

  const details = await getPartnerHotelDetails(userId, hotelId);
  if (!details) throw new Error("HOTEL_NOT_FOUND");
  return details;
}

export async function deletePartnerHotel(userId: string, hotelId: number): Promise<{ id: number }> {
  await assertPartnerOwnsHotel(userId, hotelId);

  if (await hasHotelDependencies(hotelId)) {
    throw new Error("HOTEL_HAS_DEPENDENCIES");
  }

  await deleteImageObjectsForHotel(hotelId);

  await db.transaction(async (tx) => {
    await tx.delete(hotelImages).where(eq(hotelImages.hotelId, hotelId));
    await tx.delete(hotelPaymentMethods).where(eq(hotelPaymentMethods.hotelId, hotelId));
    await tx.delete(roomTypes).where(eq(roomTypes.hotelId, hotelId));
    await tx.delete(hotels).where(eq(hotels.id, hotelId));
  });

  return { id: hotelId };
}
