import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotelImages,
  hotels,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import {
  calculateBookingNights,
  calculateBookingTotal,
  formatDateOnly,
  getBookingRoomsCount,
} from "@/server/services/bookingCalculations";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type {
  PartnerBookingDetails,
  PartnerBookingFilters,
  PartnerBookingHotelOption,
  PartnerBookingListItem,
  PartnerBookingListResult,
  PartnerBookingRow,
  PartnerBookingSort,
  PartnerBookingStatus,
  PartnerBookingStatusUpdateResult,
} from "@/types/partner-booking";
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

function normalizeGuestName(fullName: string | null, email: string): string {
  const name = fullName?.trim();
  return name || email.split("@")[0] || "Guest";
}

function normalizeBookingStatus(status: string | null): PartnerBookingStatus {
  if (status === "confirmed" || status === "cancelled" || status === "completed") {
    return status;
  }

  return "pending";
}

function normalizePaymentMethod(
  method: string | null
): BookingPaymentMethod | null {
  return (PAYMENT_METHODS as readonly string[]).includes(method ?? "")
    ? method as BookingPaymentMethod
    : null;
}

function normalizePaymentStatus(
  status: string | null,
  bookingStatus: PartnerBookingStatus
): BookingPaymentStatus {
  if ((PAYMENT_STATUSES as readonly string[]).includes(status ?? "")) {
    return status as BookingPaymentStatus;
  }

  return bookingStatus === "cancelled" ? "cancelled" : "pending";
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapListItem(row: PartnerBookingRow): PartnerBookingListItem {
  const checkInDate = formatDateOnly(row.checkInDate);
  const checkOutDate = formatDateOnly(row.checkOutDate);
  const status = normalizeBookingStatus(row.status);

  return {
    id: row.id,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    guestsCount: row.guestsCount,
    roomsCount: getBookingRoomsCount(row.roomsCount),
    checkInDate,
    checkOutDate,
    nights: calculateBookingNights(checkInDate, checkOutDate),
    status,
    paymentMethod: normalizePaymentMethod(row.paymentMethod),
    paymentStatus: normalizePaymentStatus(row.paymentStatus, status),
    pricePerNight: row.pricePerNight,
    totalPrice: calculateBookingTotal({
      pricePerNight: row.pricePerNight,
      roomsCount: row.roomsCount,
      checkInDate,
      checkOutDate,
    }),
    createdAt: toIsoString(row.createdAt),
  };
}

function mapDetails(
  row: PartnerBookingRow,
  images: { roomImageUrls: string[]; hotelCoverImageUrl: string | null }
): PartnerBookingDetails {
  return {
    ...mapListItem(row),
    guestEmail: row.userEmail,
    guestPhone: row.guestPhone,
    hotelLocation: row.hotelLocation,
    hotelDescription: row.hotelDescription,
    roomCapacity: row.roomCapacity,
    totalRooms: row.totalRooms,
    roomImageUrls: images.roomImageUrls,
    hotelCoverImageUrl: images.hotelCoverImageUrl,
    expiresAt: toIsoString(row.expiresAt),
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripeRefundId: row.stripeRefundId,
  };
}

function getStatusCondition(status: PartnerBookingStatus): SQL {
  if (status === "pending") {
    return or(eq(bookings.status, "pending"), eq(bookings.status, "pending_payment")) as SQL;
  }

  return eq(bookings.status, status);
}

function buildListConditions(
  partnerId: string,
  filters: PartnerBookingFilters
): SQL[] {
  const conditions: SQL[] = [eq(hotels.partnerId, partnerId)];

  if (filters.status) conditions.push(getStatusCondition(filters.status));
  if (filters.paymentStatus) conditions.push(eq(bookings.paymentStatus, filters.paymentStatus));
  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.dateFrom) conditions.push(gte(bookings.checkInDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(bookings.checkInDate, filters.dateTo));

  return conditions;
}

function getSortOrder(sort: PartnerBookingSort): SQL[] {
  if (sort === "check_in") return [asc(bookings.checkInDate), asc(bookings.id)];
  if (sort === "check_out") return [asc(bookings.checkOutDate), asc(bookings.id)];
  return [desc(bookings.createdAt), desc(bookings.id)];
}

async function getHotelOptions(partnerId: string): Promise<PartnerBookingHotelOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(asc(hotels.name));
}

function selectPartnerBookingRows() {
  return db
    .select({
      id: bookings.id,
      roomTypeId: bookings.roomTypeId,
      hotelId: hotels.id,
      userEmail: users.email,
      guestFullName: userProfiles.fullName,
      guestPhone: userProfiles.phone,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
      hotelDescription: hotels.description,
      roomTypeName: roomTypes.name,
      roomCapacity: roomTypes.capacity,
      totalRooms: roomTypes.totalRooms,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guestsCount: bookings.guestsCount,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
      stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
      stripeRefundId: bookings.stripeRefundId,
      expiresAt: bookings.expiresAt,
      createdAt: bookings.createdAt,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id));
}

async function countBookings(conditions: SQL[]): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(and(...conditions))
    .then((rows) => rows[0]);

  return Number(row?.value ?? 0);
}

async function getBookingImages(hotelId: number, roomTypeId: number) {
  const rows = await db
    .select({
      roomTypeId: hotelImages.roomTypeId,
      imageKey: hotelImages.imageKey,
    })
    .from(hotelImages)
    .where(
      and(
        eq(hotelImages.hotelId, hotelId),
        or(eq(hotelImages.roomTypeId, roomTypeId), isNull(hotelImages.roomTypeId))
      )
    )
    .orderBy(desc(hotelImages.isCover), asc(hotelImages.sortOrder), asc(hotelImages.id));

  const roomImageUrls = rows
    .filter((row) => row.roomTypeId === roomTypeId)
    .map((row) => resolveImageUrl(row.imageKey));
  const hotelCoverImageUrl = rows.find((row) => row.roomTypeId === null)?.imageKey ?? null;

  return {
    roomImageUrls,
    hotelCoverImageUrl: hotelCoverImageUrl ? resolveImageUrl(hotelCoverImageUrl) : null,
  };
}

async function getPartnerBookingRow(
  partnerId: string,
  bookingId: number
): Promise<PartnerBookingRow | null> {
  const row = await selectPartnerBookingRows()
    .where(and(eq(bookings.id, bookingId), eq(hotels.partnerId, partnerId)))
    .then((rows) => rows[0]);

  return row ?? null;
}

function canConfirmPendingBooking(row: PartnerBookingRow): boolean {
  if (row.paymentMethod === "cash_on_arrival") return row.paymentStatus === "pending";
  if (row.paymentMethod === "stripe") return row.paymentStatus === "paid";
  return false;
}

function canTransitionStatus(row: PartnerBookingRow, next: PartnerBookingStatus): boolean {
  const current = normalizeBookingStatus(row.status);
  if (current === next) return true;
  if (current === "pending") {
    if (next === "confirmed") return canConfirmPendingBooking(row);
    return next === "cancelled";
  }
  if (current === "confirmed") return next === "cancelled" || next === "completed";
  return false;
}

export async function listPartnerBookings(
  userId: string,
  filters: PartnerBookingFilters
): Promise<PartnerBookingListResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const conditions = buildListConditions(partnerId, filters);
  const [hotelOptions, totalItems] = await Promise.all([
    getHotelOptions(partnerId),
    countBookings(conditions),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);

  const rows = await selectPartnerBookingRows()
    .where(and(...conditions))
    .orderBy(...getSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return {
    bookings: rows.map((row) => mapListItem(row)),
    hotels: hotelOptions,
    filters: { ...filters, page },
    pagination: {
      page,
      pageSize: filters.pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getPartnerBookingDetails(
  userId: string,
  bookingId: number
): Promise<PartnerBookingDetails | null> {
  const partnerId = await getPartnerIdForUser(userId);
  const row = await getPartnerBookingRow(partnerId, bookingId);
  if (!row) return null;

  const images = await getBookingImages(row.hotelId, row.roomTypeId);
  return mapDetails(row, images);
}

export async function updatePartnerBookingStatus(
  userId: string,
  bookingId: number,
  status: PartnerBookingStatus
): Promise<PartnerBookingStatusUpdateResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const row = await getPartnerBookingRow(partnerId, bookingId);
  if (!row) throw new Error("BOOKING_NOT_FOUND");

  if (!canTransitionStatus(row, status)) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  const update = status === "pending"
    ? { status }
    : { status, expiresAt: null };

  const updated = await db
    .update(bookings)
    .set(update)
    .where(and(eq(bookings.id, bookingId), eq(bookings.roomTypeId, row.roomTypeId)))
    .returning({ id: bookings.id, status: bookings.status });

  if (!updated.length) throw new Error("BOOKING_NOT_FOUND");

  return {
    id: updated[0].id,
    status: normalizeBookingStatus(updated[0].status),
  };
}
