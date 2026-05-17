import {
  and,
  asc,
  eq,
  gt,
  inArray,
  lt,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { bookings, hotels, roomTypes, userProfiles, users } from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import { getBookingRoomsCount } from "@/server/services/bookingCalculations";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type {
  PartnerCalendarAvailabilityCell,
  PartnerCalendarAvailabilityResult,
  PartnerCalendarBookingRow,
  PartnerCalendarBookingStatus,
  PartnerCalendarEvent,
  PartnerCalendarFilters,
  PartnerCalendarHotelOption,
  PartnerCalendarResult,
  PartnerCalendarRoomTypeOption,
  PartnerCalendarRoomTypeRow,
} from "@/types/partner-calendar";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

const PAYMENT_METHODS = ["stripe", "cash_on_arrival"] as const;
const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  for (let date = parseDateOnly(dateFrom); formatDateOnly(date) <= dateTo; date = addDays(date, 1)) {
    dates.push(formatDateOnly(date));
  }
  return dates;
}

function normalizeGuestName(fullName: string | null, email: string): string {
  const name = fullName?.trim();
  return name || email.split("@")[0] || "Guest";
}

function normalizeBookingStatus(status: string | null): PartnerCalendarBookingStatus {
  if (status === "confirmed" || status === "cancelled" || status === "completed") return status;
  return "pending";
}

function normalizePaymentMethod(method: string | null): BookingPaymentMethod | null {
  return (PAYMENT_METHODS as readonly string[]).includes(method ?? "")
    ? method as BookingPaymentMethod
    : null;
}

function normalizePaymentStatus(status: string | null): BookingPaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(status ?? "")
    ? status as BookingPaymentStatus
    : "pending";
}

function getStatusCondition(status: PartnerCalendarBookingStatus): SQL {
  if (status === "pending") {
    return or(eq(bookings.status, "pending"), eq(bookings.status, "pending_payment")) as SQL;
  }

  return eq(bookings.status, status);
}

function buildBookingConditions(
  partnerId: string,
  filters: PartnerCalendarFilters
): SQL[] {
  const rangeEnd = formatDateOnly(addDays(parseDateOnly(filters.dateTo), 1));
  const conditions: SQL[] = [
    eq(hotels.partnerId, partnerId),
    lt(bookings.checkInDate, rangeEnd),
    gt(bookings.checkOutDate, filters.dateFrom),
  ];

  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.roomTypeId) conditions.push(eq(roomTypes.id, filters.roomTypeId));
  if (filters.status) conditions.push(getStatusCondition(filters.status));

  return conditions;
}

function activeAvailabilityCondition(): SQL {
  return or(
    inArray(bookings.status, ["confirmed", "completed"]),
    and(
      or(eq(bookings.status, "pending"), eq(bookings.status, "pending_payment")),
      gt(bookings.expiresAt, new Date())
    )
  ) as SQL;
}

function mapEvent(row: PartnerCalendarBookingRow): PartnerCalendarEvent {
  return {
    bookingId: row.bookingId,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    guestsCount: row.guestsCount,
    roomsCount: getBookingRoomsCount(row.roomsCount),
    status: normalizeBookingStatus(row.status),
    paymentMethod: normalizePaymentMethod(row.paymentMethod),
    paymentStatus: normalizePaymentStatus(row.paymentStatus),
  };
}

function availabilityStatus(
  bookedRooms: number,
  totalRooms: number
): PartnerCalendarAvailabilityCell["status"] {
  if (bookedRooms <= 0) return "available";
  return bookedRooms >= totalRooms ? "full" : "partial";
}

function calculateAvailability(
  room: PartnerCalendarRoomTypeRow,
  dates: string[],
  activeBookings: PartnerCalendarEvent[]
): PartnerCalendarAvailabilityCell[] {
  return dates.map((date) => {
    const bookedRooms = activeBookings
      .filter((event) => event.roomTypeId === room.roomTypeId)
      .filter((event) => date >= event.checkInDate && date < event.checkOutDate)
      .reduce((total, event) => total + event.roomsCount, 0);
    const availableRooms = Math.max(room.totalRooms - bookedRooms, 0);

    return {
      date,
      bookedRooms,
      availableRooms,
      totalRooms: room.totalRooms,
      status: availabilityStatus(bookedRooms, room.totalRooms),
    };
  });
}

function mapCalendarRows(
  rooms: PartnerCalendarRoomTypeRow[],
  dates: string[],
  events: PartnerCalendarEvent[],
  activeBookings: PartnerCalendarEvent[]
) {
  return rooms.map((room) => ({
    roomTypeId: room.roomTypeId,
    roomTypeName: room.roomTypeName,
    hotelId: room.hotelId,
    hotelName: room.hotelName,
    totalRooms: room.totalRooms,
    availability: calculateAvailability(room, dates, activeBookings),
    events: events.filter((event) => event.roomTypeId === room.roomTypeId),
  }));
}

async function getHotelOptions(partnerId: string): Promise<PartnerCalendarHotelOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(asc(hotels.name));
}

async function getRoomTypeOptions(
  partnerId: string,
  hotelId?: number
): Promise<PartnerCalendarRoomTypeOption[]> {
  const conditions = [eq(hotels.partnerId, partnerId)];
  if (hotelId) conditions.push(eq(hotels.id, hotelId));

  return db
    .select({
      id: roomTypes.id,
      hotelId: hotels.id,
      hotelName: hotels.name,
      name: roomTypes.name,
    })
    .from(roomTypes)
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(and(...conditions))
    .orderBy(asc(hotels.name), asc(roomTypes.name));
}

async function getCalendarRooms(
  partnerId: string,
  filters: PartnerCalendarFilters
): Promise<PartnerCalendarRoomTypeRow[]> {
  const conditions = [eq(hotels.partnerId, partnerId)];
  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.roomTypeId) conditions.push(eq(roomTypes.id, filters.roomTypeId));

  return db
    .select({
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      hotelId: hotels.id,
      hotelName: hotels.name,
      totalRooms: roomTypes.totalRooms,
    })
    .from(roomTypes)
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(and(...conditions))
    .orderBy(asc(hotels.name), asc(roomTypes.name));
}

async function getCalendarBookingRows(
  partnerId: string,
  filters: PartnerCalendarFilters,
  activeOnly = false
): Promise<PartnerCalendarBookingRow[]> {
  const conditions = buildBookingConditions(partnerId, filters);
  if (activeOnly) conditions.push(activeAvailabilityCondition());

  return db
    .select({
      bookingId: bookings.id,
      userEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelId: hotels.id,
      hotelName: hotels.name,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      totalRooms: roomTypes.totalRooms,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guestsCount: bookings.guestsCount,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(bookings.checkInDate), asc(bookings.id));
}

export async function getPartnerCalendar(
  userId: string,
  filters: PartnerCalendarFilters
): Promise<PartnerCalendarResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const dates = buildDateRange(filters.dateFrom, filters.dateTo);
  const [hotelsList, roomTypeOptions, rooms, bookingRows, activeRows] = await Promise.all([
    getHotelOptions(partnerId),
    getRoomTypeOptions(partnerId, filters.hotelId),
    getCalendarRooms(partnerId, filters),
    getCalendarBookingRows(partnerId, filters),
    getCalendarBookingRows(partnerId, { ...filters, status: undefined }, true),
  ]);
  const events = bookingRows.map(mapEvent);
  const activeBookings = activeRows.map(mapEvent);

  return {
    dates,
    rows: mapCalendarRows(rooms, dates, events, activeBookings),
    events,
    hotels: hotelsList,
    roomTypes: roomTypeOptions,
    filters,
  };
}

export async function getPartnerCalendarAvailability(
  userId: string,
  filters: PartnerCalendarFilters
): Promise<PartnerCalendarAvailabilityResult> {
  const result = await getPartnerCalendar(userId, filters);
  return {
    dates: result.dates,
    rows: result.rows,
    filters: result.filters,
  };
}
