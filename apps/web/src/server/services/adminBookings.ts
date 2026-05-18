import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotels,
  partners,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import {
  calculateBookingNights,
  calculateBookingTotal,
  getBookingRoomsCount,
} from "@/server/services/bookingCalculations";
import { cancelAdminBooking } from "@/server/services/bookings";
import type {
  AdminBookingCounts,
  AdminBookingDetails,
  AdminBookingFilters,
  AdminBookingListItem,
  AdminBookingListResult,
  AdminBookingOption,
  AdminBookingStatus,
  AdminBookingUpdateInput,
} from "@/types/admin-bookings";
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

type AdminBookingRow = {
  id: number;
  guestUserId: string;
  guestEmail: string;
  guestFullName: string | null;
  guestPhone: string | null;
  hotelId: number;
  hotelName: string;
  hotelLocation: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeId: number;
  roomTypeName: string;
  roomCapacity: number;
  totalRooms: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number | null;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  expiresAt: Date | string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  createdAt: Date | string | null;
  pricePerNight: number;
};

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateString(value: Date | string): string {
  return value instanceof Date ? formatDateOnly(value) : value.slice(0, 10);
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function addEndOfDay(date: string): Date {
  const value = parseDateOnly(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function displayName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || "Guest";
}

function normalizeStatus(status: string | null): AdminBookingStatus {
  if (status === "confirmed" || status === "cancelled" || status === "completed" || status === "expired") {
    return status;
  }

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

function statusCondition(status: AdminBookingStatus): SQL {
  if (status === "pending") {
    return or(eq(bookings.status, "pending"), eq(bookings.status, "pending_payment")) as SQL;
  }

  return eq(bookings.status, status);
}

function buildBookingConditions(filters: AdminBookingFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.status) conditions.push(statusCondition(filters.status));
  if (filters.paymentStatus) conditions.push(eq(bookings.paymentStatus, filters.paymentStatus));
  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.partnerId) conditions.push(eq(partners.id, filters.partnerId));
  if (filters.dateFrom) conditions.push(sql`${bookings.checkOutDate} > ${filters.dateFrom}::date`);
  if (filters.dateTo) conditions.push(sql`${bookings.checkInDate} < ${dateEndExclusive(filters.dateTo)}::date`);
  if (filters.createdFrom) conditions.push(gte(bookings.createdAt, parseDateOnly(filters.createdFrom)));
  if (filters.createdTo) conditions.push(lte(bookings.createdAt, addEndOfDay(filters.createdTo)));
  if (filters.guestSearch) conditions.push(guestSearchCondition(filters.guestSearch));

  return conditions;
}

function dateEndExclusive(dateTo: string): string {
  const date = parseDateOnly(dateTo);
  date.setDate(date.getDate() + 1);
  return formatDateOnly(date);
}

function guestSearchCondition(search: string): SQL {
  const pattern = `%${search}%`;
  return or(
    ilike(users.email, pattern),
    ilike(userProfiles.fullName, pattern),
    sql`${users.id}::text ilike ${pattern}`
  ) as SQL;
}

function getSortOrder(sort: AdminBookingFilters["sort"]): SQL[] {
  if (sort === "check_in") return [asc(bookings.checkInDate), asc(bookings.id)];
  if (sort === "check_out") return [asc(bookings.checkOutDate), asc(bookings.id)];
  if (sort === "total_price") {
    return [
      sql`(${roomTypes.pricePerNight} * coalesce(${bookings.roomsCount}, 1) * greatest(${bookings.checkOutDate} - ${bookings.checkInDate}, 1)) desc`,
      desc(bookings.createdAt),
    ];
  }

  return [desc(bookings.createdAt), desc(bookings.id)];
}

function selectAdminBookingRows() {
  return db
    .select({
      id: bookings.id,
      guestUserId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      guestPhone: userProfiles.phone,
      hotelId: hotels.id,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      roomTypeId: roomTypes.id,
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
      expiresAt: bookings.expiresAt,
      stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
      stripeRefundId: bookings.stripeRefundId,
      createdAt: bookings.createdAt,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id));
}

function mapListItem(row: AdminBookingRow): AdminBookingListItem {
  const checkInDate = toDateString(row.checkInDate);
  const checkOutDate = toDateString(row.checkOutDate);

  return {
    id: row.id,
    guestUserId: row.guestUserId,
    guestFullName: displayName(row.guestFullName, row.guestEmail),
    guestEmail: row.guestEmail,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    partnerId: row.partnerId,
    partnerCompanyName: row.partnerCompanyName,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    checkInDate,
    checkOutDate,
    nights: calculateBookingNights(checkInDate, checkOutDate),
    guestsCount: row.guestsCount,
    roomsCount: getBookingRoomsCount(row.roomsCount),
    status: normalizeStatus(row.status),
    rawStatus: row.status,
    paymentStatus: normalizePaymentStatus(row.paymentStatus),
    rawPaymentStatus: row.paymentStatus,
    paymentMethod: normalizePaymentMethod(row.paymentMethod),
    totalPrice: calculateBookingTotal({
      pricePerNight: row.pricePerNight,
      roomsCount: row.roomsCount,
      checkInDate,
      checkOutDate,
    }),
    createdAt: toIsoString(row.createdAt),
  };
}

function mapDetails(row: AdminBookingRow): AdminBookingDetails {
  return {
    ...mapListItem(row),
    guestPhone: row.guestPhone,
    hotelLocation: row.hotelLocation,
    roomCapacity: row.roomCapacity,
    totalRooms: row.totalRooms,
    pricePerNight: row.pricePerNight,
    expiresAt: toIsoString(row.expiresAt),
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripeRefundId: row.stripeRefundId,
  };
}

async function countFilteredBookings(filters: AdminBookingFilters): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...buildBookingConditions(filters)))
    .then((rows) => rows[0]);

  return toNumber(row?.value);
}

async function getBookingCounts(): Promise<AdminBookingCounts> {
  const [statusRows, paymentRows] = await Promise.all([getStatusCounts(), getPaymentCounts()]);
  const statusCount = (status: AdminBookingStatus) => toNumber(statusRows.find((row) => row.status === status)?.value);
  const paymentCount = (status: string) => toNumber(paymentRows.find((row) => row.status === status)?.value);

  return {
    total: statusRows.reduce((sum, row) => sum + toNumber(row.value), 0),
    pending: statusCount("pending"),
    confirmed: statusCount("confirmed"),
    cancelled: statusCount("cancelled"),
    completed: statusCount("completed"),
    paid: paymentCount("paid"),
    paymentPending: paymentCount("pending"),
    failed: paymentCount("failed"),
  };
}

async function getStatusCounts() {
  return db.execute<{ status: AdminBookingStatus; value: number }>(sql`
    select
      case
        when status in ('pending', 'pending_payment') then 'pending'
        when status in ('confirmed', 'cancelled', 'completed', 'expired') then status
        else 'pending'
      end as status,
      count(*)::int as value
    from bookings
    group by 1
  `).then((result) => result.rows);
}

async function getPaymentCounts() {
  return db
    .select({
      status: bookings.paymentStatus,
      value: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .groupBy(bookings.paymentStatus);
}

async function getHotelOptions(): Promise<AdminBookingOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .orderBy(asc(hotels.name));
}

async function getPartnerOptions(): Promise<AdminBookingOption[]> {
  return db
    .select({ id: partners.id, name: partners.companyName })
    .from(partners)
    .orderBy(asc(partners.companyName));
}

export async function listAdminBookings(
  filters: AdminBookingFilters
): Promise<AdminBookingListResult> {
  const [totalItems, counts, hotels, partnerOptions] = await Promise.all([
    countFilteredBookings(filters),
    getBookingCounts(),
    getHotelOptions(),
    getPartnerOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const rows = await selectAdminBookingRows()
    .where(and(...buildBookingConditions(filters)))
    .orderBy(...getSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return {
    bookings: rows.map((row) => mapListItem(row as AdminBookingRow)),
    hotels,
    partners: partnerOptions,
    counts,
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
  };
}

export async function getAdminBookingDetails(
  bookingId: number
): Promise<AdminBookingDetails | null> {
  const row = await selectAdminBookingRows()
    .where(eq(bookings.id, bookingId))
    .then((rows) => rows[0] ?? null);

  return row ? mapDetails(row as AdminBookingRow) : null;
}

export async function updateAdminBookingStatus(
  bookingId: number,
  input: AdminBookingUpdateInput
): Promise<AdminBookingDetails> {
  if (input.status === "cancelled") {
    await cancelAdminBooking(bookingId);
    const cancelledBooking = await getAdminBookingDetails(bookingId);
    if (!cancelledBooking) throw new Error("BOOKING_NOT_FOUND");
    return cancelledBooking;
  }

  const update = input.status === "expired"
    ? { status: input.status, expiresAt: null }
    : { status: input.status };

  const updated = await db
    .update(bookings)
    .set(update)
    .where(eq(bookings.id, bookingId))
    .returning({ id: bookings.id });

  if (!updated.length) throw new Error("BOOKING_NOT_FOUND");

  const booking = await getAdminBookingDetails(bookingId);
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  return booking;
}
