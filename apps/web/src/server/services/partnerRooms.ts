import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { bookings, hotels, roomTypes } from "@/db/schema";
import { getScopedImages, syncScopedImages } from "@/server/services/partnerImages";
import {
  assertPartnerOwnsHotel,
  getPartnerHotelDetails,
  getPartnerIdForUser,
} from "@/server/services/partnerHotels";
import type { PartnerRoomMutationInput, PartnerRoomType } from "@/types/partner-hotel";

type RoomRecord = {
  id: number;
  hotelId: number;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
};

function mapRoom(row: RoomRecord, images = [] as PartnerRoomType["images"]): PartnerRoomType {
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

async function getRoomRecordForPartner(userId: string, roomId: number): Promise<RoomRecord | null> {
  const partnerId = await getPartnerIdForUser(userId);

  return db
    .select({
      id: roomTypes.id,
      hotelId: roomTypes.hotelId,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerNight: roomTypes.pricePerNight,
      totalRooms: roomTypes.totalRooms,
    })
    .from(roomTypes)
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(and(eq(roomTypes.id, roomId), eq(hotels.partnerId, partnerId)))
    .then((rows) => rows[0] ?? null);
}

async function assertRoomHasNoBookings(roomId: number): Promise<void> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookings)
    .where(eq(bookings.roomTypeId, roomId))
    .then((rows) => rows[0]);

  if (Number(row?.value ?? 0) > 0) {
    throw new Error("ROOM_HAS_BOOKINGS");
  }
}

async function getRoomDetails(row: RoomRecord): Promise<PartnerRoomType> {
  const images = await getScopedImages({ hotelId: row.hotelId, roomTypeId: row.id });
  return mapRoom(row, images);
}

export async function listPartnerRoomsForHotel(
  userId: string,
  hotelId: number
): Promise<PartnerRoomType[]> {
  const hotel = await getPartnerHotelDetails(userId, hotelId);
  return hotel?.rooms ?? [];
}

export async function getPartnerRoom(
  userId: string,
  roomId: number
): Promise<PartnerRoomType | null> {
  const row = await getRoomRecordForPartner(userId, roomId);
  return row ? getRoomDetails(row) : null;
}

export async function createPartnerRoom(
  userId: string,
  input: PartnerRoomMutationInput
): Promise<PartnerRoomType> {
  await assertPartnerOwnsHotel(userId, input.hotelId);

  const created = await db.transaction(async (tx) => {
    const [room] = await tx
      .insert(roomTypes)
      .values({
        hotelId: input.hotelId,
        name: input.name,
        capacity: input.capacity,
        pricePerNight: input.pricePerNight,
        totalRooms: input.totalRooms,
      })
      .returning({
        id: roomTypes.id,
        hotelId: roomTypes.hotelId,
        name: roomTypes.name,
        capacity: roomTypes.capacity,
        pricePerNight: roomTypes.pricePerNight,
        totalRooms: roomTypes.totalRooms,
      });

    await syncScopedImages(tx, { hotelId: input.hotelId, roomTypeId: room.id }, input.images);
    return room;
  });

  return getRoomDetails(created);
}

export async function updatePartnerRoom(
  userId: string,
  roomId: number,
  input: PartnerRoomMutationInput
): Promise<PartnerRoomType> {
  const current = await getRoomRecordForPartner(userId, roomId);
  if (!current) throw new Error("ROOM_NOT_FOUND");
  if (current.hotelId !== input.hotelId) throw new Error("ROOM_HOTEL_MISMATCH");

  await db.transaction(async (tx) => {
    await tx
      .update(roomTypes)
      .set({
        name: input.name,
        capacity: input.capacity,
        pricePerNight: input.pricePerNight,
        totalRooms: input.totalRooms,
      })
      .where(eq(roomTypes.id, roomId));

    await syncScopedImages(tx, { hotelId: current.hotelId, roomTypeId: roomId }, input.images);
  });

  const updated = await getPartnerRoom(userId, roomId);
  if (!updated) throw new Error("ROOM_NOT_FOUND");
  return updated;
}

export async function deletePartnerRoom(userId: string, roomId: number): Promise<{ id: number }> {
  const room = await getRoomRecordForPartner(userId, roomId);
  if (!room) throw new Error("ROOM_NOT_FOUND");

  await assertRoomHasNoBookings(roomId);

  await db.transaction(async (tx) => {
    await syncScopedImages(
      tx,
      { hotelId: room.hotelId, roomTypeId: roomId },
      { existingImages: [], directImages: [], fileImages: [] }
    );
    await tx.delete(roomTypes).where(eq(roomTypes.id, roomId));
  });

  return { id: roomId };
}

export async function getRoomOptionsForPartnerHotel(
  userId: string,
  hotelId: number
): Promise<RoomRecord[]> {
  await assertPartnerOwnsHotel(userId, hotelId);

  return db
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
}
