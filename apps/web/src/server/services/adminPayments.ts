import "server-only";

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
  hotels,
  partners,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import {
  calculateBookingTotal,
  getBookingRoomsCount,
} from "@/server/services/bookingCalculations";
import type { AdminBookingStatus } from "@/types/admin-bookings";
import type {
  AdminPaymentFilters,
  AdminPaymentListItem,
  AdminPaymentListResult,
  AdminPaymentOption,
  AdminPaymentSummary,
} from "@/types/admin-payments";
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

type AdminPaymentRow = {
  bookingId: number;
  guestUserId: string;
  guestEmail: string;
  guestFullName: string | null;
  hotelId: number;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  roomsCount: number | null;
  bookingStatus: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  createdAt: string | Date | null;
  pricePerNight: number;
};

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateString(value: Date | string): string {
  return value instanceof Date ? formatDateOnly(value) : value.slice(0, 10);
}

function addEndOfDay(date: string): Date {
  const value = parseDateOnly(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function displayName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || "Guest";
}

function normalizeBookingStatus(status: string | null): AdminBookingStatus {
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

function buildPaymentConditions(filters: AdminPaymentFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.paymentStatus === "pending") {
    conditions.push(or(eq(bookings.paymentStatus, "pending"), isNull(bookings.paymentStatus)) as SQL);
  } else if (filters.paymentStatus) {
    conditions.push(eq(bookings.paymentStatus, filters.paymentStatus));
  }
  if (filters.paymentMethod) conditions.push(eq(bookings.paymentMethod, filters.paymentMethod));
  if (filters.bookingStatus) conditions.push(statusCondition(filters.bookingStatus));
  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.partnerId) conditions.push(eq(partners.id, filters.partnerId));
  if (filters.createdFrom) conditions.push(gte(bookings.createdAt, parseDateOnly(filters.createdFrom)));
  if (filters.createdTo) conditions.push(lte(bookings.createdAt, addEndOfDay(filters.createdTo)));

  return conditions;
}

function getSortOrder(sort: AdminPaymentFilters["sort"]): SQL[] {
  const amount = sql`(${roomTypes.pricePerNight} * coalesce(${bookings.roomsCount}, 1) * greatest(${bookings.checkOutDate} - ${bookings.checkInDate}, 1))`;

  if (sort === "oldest") return [asc(bookings.createdAt), asc(bookings.id)];
  if (sort === "amount_asc") return [sql`${amount} asc`, asc(bookings.id)];
  if (sort === "amount_desc") return [sql`${amount} desc`, desc(bookings.createdAt)];
  if (sort === "payment_status") return [asc(bookings.paymentStatus), desc(bookings.createdAt)];

  return [desc(bookings.createdAt), desc(bookings.id)];
}

function selectAdminPaymentRows() {
  return db
    .select({
      bookingId: bookings.id,
      guestUserId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelId: hotels.id,
      hotelName: hotels.name,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomsCount: bookings.roomsCount,
      bookingStatus: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
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

function mapPaymentRow(row: AdminPaymentRow): AdminPaymentListItem {
  const checkInDate = toDateString(row.checkInDate);
  const checkOutDate = toDateString(row.checkOutDate);

  return {
    bookingId: row.bookingId,
    guestUserId: row.guestUserId,
    guestName: displayName(row.guestFullName, row.guestEmail),
    guestEmail: row.guestEmail,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    partnerId: row.partnerId,
    partnerCompanyName: row.partnerCompanyName,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    paymentMethod: normalizePaymentMethod(row.paymentMethod),
    paymentStatus: normalizePaymentStatus(row.paymentStatus),
    rawPaymentStatus: row.paymentStatus,
    bookingStatus: normalizeBookingStatus(row.bookingStatus),
    rawBookingStatus: row.bookingStatus,
    totalAmount: calculateBookingTotal({
      pricePerNight: row.pricePerNight,
      roomsCount: getBookingRoomsCount(row.roomsCount),
      checkInDate,
      checkOutDate,
    }),
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripeRefundId: row.stripeRefundId,
    createdAt: toIsoString(row.createdAt),
  };
}

async function countFilteredPayments(filters: AdminPaymentFilters): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...buildPaymentConditions(filters)))
    .then((rows) => rows[0]);

  return toNumber(row?.value);
}

async function getPaymentSummary(): Promise<AdminPaymentSummary> {
  const result = await db.execute<Record<string, unknown>>(sql`
    select
      count(*)::int as total,
      count(*) filter (where payment_status = 'paid')::int as paid,
      count(*) filter (where coalesce(payment_status, 'pending') = 'pending')::int as pending,
      count(*) filter (where payment_status = 'failed')::int as failed,
      count(*) filter (where payment_status = 'refunded')::int as refunded,
      count(*) filter (where payment_status = 'refund_pending')::int as refund_pending,
      count(*) filter (
        where payment_method = 'stripe'
          and payment_status = 'paid'
          and stripe_payment_intent_id is null
      )::int as stripe_missing_intent,
      coalesce(sum(rt.price_per_night * coalesce(b.rooms_count, 1) *
        greatest(b.check_out_date - b.check_in_date, 1)
      ) filter (
        where b.payment_status = 'paid'
          and b.status in ('confirmed', 'completed')
      ), 0)::numeric as paid_revenue,
      coalesce(sum(rt.price_per_night * coalesce(b.rooms_count, 1) *
        greatest(b.check_out_date - b.check_in_date, 1)
      ) filter (
        where b.payment_status in ('refund_pending', 'refunded')
      ), 0)::numeric as refund_exposure
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
  `);
  const row = result.rows[0] ?? {};

  return {
    total: toNumber(row.total),
    paid: toNumber(row.paid),
    pending: toNumber(row.pending),
    failed: toNumber(row.failed),
    refunded: toNumber(row.refunded),
    refundPending: toNumber(row.refund_pending),
    paidRevenue: toNumber(row.paid_revenue),
    refundExposure: toNumber(row.refund_exposure),
    stripeMissingIntent: toNumber(row.stripe_missing_intent),
  };
}

async function getHotelOptions(): Promise<AdminPaymentOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .orderBy(asc(hotels.name));
}

async function getPartnerOptions(): Promise<AdminPaymentOption[]> {
  return db
    .select({ id: partners.id, name: partners.companyName })
    .from(partners)
    .orderBy(asc(partners.companyName));
}

export async function listAdminPayments(
  filters: AdminPaymentFilters
): Promise<AdminPaymentListResult> {
  const [totalItems, summary, hotels, partnerOptions] = await Promise.all([
    countFilteredPayments(filters),
    getPaymentSummary(),
    getHotelOptions(),
    getPartnerOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const rows = await selectAdminPaymentRows()
    .where(and(...buildPaymentConditions(filters)))
    .orderBy(...getSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return {
    payments: rows.map((row) => mapPaymentRow(row as AdminPaymentRow)),
    hotels,
    partners: partnerOptions,
    summary,
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
  };
}
