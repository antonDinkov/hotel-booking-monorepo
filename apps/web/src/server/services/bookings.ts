import { eq } from "drizzle-orm";

import { db } from "../../db";
import { bookings, roomTypes, hotels, hotelImages } from "../../db/schema";
import type { MyBooking, BookingStatus } from "@/types/booking";

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getNightCount(checkIn: Date, checkOut: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const normalizedCheckIn = normalizeDate(checkIn);
  const normalizedCheckOut = normalizeDate(checkOut);
  return Math.max(0, Math.round((normalizedCheckOut.getTime() - normalizedCheckIn.getTime()) / msPerDay));
}

function computeBookingStatus(checkIn: Date, checkOut: Date): BookingStatus {
  const today = normalizeDate(new Date());
  const normalizedCheckIn = normalizeDate(checkIn);
  const normalizedCheckOut = normalizeDate(checkOut);

  if (today < normalizedCheckIn) {
    return "upcoming";
  }

  if (today > normalizedCheckOut) {
    return "past";
  }

  return "active";
}

function computeDaysRemaining(checkOut: Date): number {
  const today = normalizeDate(new Date());
  const normalizedCheckOut = normalizeDate(checkOut);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((normalizedCheckOut.getTime() - today.getTime()) / msPerDay));
}

interface BookingRow {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string | null;
  roomPrice: number | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelImageUrl: string | null;
}

export async function getBookings(userId: string): Promise<MyBooking[]> {
  const rows = await db
    .select({
      id: bookings.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomTypeName: roomTypes.name,
      roomPrice: roomTypes.pricePerNight,
      hotelName: hotels.name,
      hotelAddress: hotels.location,
      hotelImageUrl: hotelImages.imageKey,
    })
    .from(bookings)
    .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .leftJoin(hotelImages, eq(hotelImages.hotelId, hotels.id))
    .where(eq(bookings.userId, userId))
    .orderBy(bookings.checkInDate);

  const uniqueBookings = new Map<number, BookingRow>();

  for (const row of rows) {
    if (!uniqueBookings.has(row.id)) {
      uniqueBookings.set(row.id, row as BookingRow);
    }
  }

  return Array.from(uniqueBookings.values()).map((row) => {
    const checkIn = new Date(row.checkInDate);
    const checkOut = new Date(row.checkOutDate);
    const status = computeBookingStatus(checkIn, checkOut);
    const nights = getNightCount(checkIn, checkOut);
    const totalPrice = (row.roomPrice ?? 0) * Math.max(1, nights);

    return {
      id: String(row.id),
      hotelName: row.hotelName ?? "Unknown hotel",
      hotelAddress: row.hotelAddress ?? "",
      hotelImage: row.hotelImageUrl ?? undefined,
      roomType: row.roomTypeName ?? "Room",
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      totalPrice,
      status,
      daysRemaining: status === "active" ? computeDaysRemaining(checkOut) : undefined,
    };
  }).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
}
