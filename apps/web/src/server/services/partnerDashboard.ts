import { and, asc, desc, eq, gte, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotels,
  reviews,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import {
  calculateBookingTotal,
  getBookingRoomsCount,
} from "@/server/services/bookingCalculations";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type { BookingPaymentStatus } from "@/types/booking";
import type {
  PartnerDashboardBookingRow,
  PartnerDashboardBookingStatus,
  PartnerDashboardDailyMetricRow,
  PartnerDashboardHotelPerformance,
  PartnerDashboardHotelPerformanceRow,
  PartnerDashboardMetrics,
  PartnerDashboardRange,
  PartnerDashboardRecentBooking,
  PartnerDashboardRecentReview,
  PartnerDashboardResult,
  PartnerDashboardReviewRow,
  PartnerDashboardSummaryRow,
  PartnerDashboardUpcomingCheckIn,
} from "@/types/partner-dashboard";

const RECENT_LIMIT = 5;
const REVIEW_LIMIT = 3;
const HOTEL_PERFORMANCE_LIMIT = 5;
const OCCUPANCY_DAYS = 30;
const TREND_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

async function executeRows<T extends Record<string, unknown>>(
  query: SQL
): Promise<T[]> {
  const result = await db.execute<T>(query);
  return result.rows;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDashboardRange(): PartnerDashboardRange {
  const todayDate = parseDateOnly(formatDateOnly(new Date()));
  const monthStartDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

  return {
    today: formatDateOnly(todayDate),
    monthStart: formatDateOnly(monthStartDate),
    monthEnd: formatDateOnly(addDays(todayDate, 1)),
    occupancyStart: formatDateOnly(addDays(todayDate, -(OCCUPANCY_DAYS - 1))),
    occupancyEnd: formatDateOnly(addDays(todayDate, 1)),
    trendStart: formatDateOnly(addDays(todayDate, -(TREND_DAYS - 1))),
    trendEnd: formatDateOnly(todayDate),
  };
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function daysBetween(start: string, endExclusive: string): number {
  const startTime = parseDateOnly(start).getTime();
  const endTime = parseDateOnly(endExclusive).getTime();
  return Math.max(1, Math.round((endTime - startTime) / MS_PER_DAY));
}

function normalizeGuestName(fullName: string | null, email: string): string {
  const name = fullName?.trim();
  return name || email.split("@")[0] || "Guest";
}

function normalizeBookingStatus(
  status: string | null
): PartnerDashboardBookingStatus {
  if (status === "confirmed" || status === "cancelled" || status === "completed") {
    return status;
  }

  return "pending";
}

function normalizePaymentStatus(
  status: string | null,
  bookingStatus: PartnerDashboardBookingStatus
): BookingPaymentStatus {
  if ((PAYMENT_STATUSES as readonly string[]).includes(status ?? "")) {
    return status as BookingPaymentStatus;
  }

  return bookingStatus === "cancelled" ? "cancelled" : "pending";
}

function toIsoString(value: Date | string | null): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function commentPreview(comment: string | null): string {
  const value = comment?.trim() || "No comment provided.";
  if (value.length <= 140) return value;
  return `${value.slice(0, 137).trimEnd()}...`;
}

function mapMetrics(row: PartnerDashboardSummaryRow): PartnerDashboardMetrics {
  return {
    totalHotels: toNumber(row.total_hotels),
    totalRoomTypes: toNumber(row.total_room_types),
    totalRoomInventory: toNumber(row.total_room_inventory),
    totalBookings: toNumber(row.total_bookings),
    upcomingBookings: toNumber(row.upcoming_bookings),
    pendingBookings: toNumber(row.pending_bookings),
    confirmedBookings: toNumber(row.confirmed_bookings),
    cancelledBookings: toNumber(row.cancelled_bookings),
    completedBookings: toNumber(row.completed_bookings),
    totalRevenue: round(toNumber(row.total_revenue)),
    revenueThisMonth: round(toNumber(row.revenue_this_month)),
    averageOccupancyRate: round(toNumber(row.average_occupancy_rate)),
    averageReviewRating: row.average_review_rating === null
      ? null
      : round(toNumber(row.average_review_rating), 2),
    totalReviews: toNumber(row.total_reviews),
    unrepliedReviewsCount: toNumber(row.unreplied_reviews_count),
    occupancyBookedRoomNights: toNumber(row.occupancy_booked_room_nights),
    occupancyAvailableRoomNights: toNumber(row.occupancy_available_room_nights),
  };
}

function mapBooking(row: PartnerDashboardBookingRow): PartnerDashboardRecentBooking {
  const status = normalizeBookingStatus(row.status);
  const checkInDate = formatDateOnly(row.checkInDate);
  const checkOutDate = formatDateOnly(row.checkOutDate);

  return {
    id: row.id,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    hotelName: row.hotelName,
    roomTypeName: row.roomTypeName,
    checkInDate,
    checkOutDate,
    status,
    paymentStatus: normalizePaymentStatus(row.paymentStatus, status),
    totalPrice: calculateBookingTotal({
      pricePerNight: row.pricePerNight,
      roomsCount: row.roomsCount,
      checkInDate,
      checkOutDate,
    }),
  };
}

function mapUpcomingCheckIn(
  row: PartnerDashboardBookingRow
): PartnerDashboardUpcomingCheckIn {
  return {
    id: row.id,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    hotelName: row.hotelName,
    roomTypeName: row.roomTypeName,
    checkInDate: formatDateOnly(row.checkInDate),
    guestsCount: row.guestsCount,
    roomsCount: getBookingRoomsCount(row.roomsCount),
  };
}

function mapReview(row: PartnerDashboardReviewRow): PartnerDashboardRecentReview {
  return {
    id: row.id,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    hotelName: row.hotelName,
    rating: row.rating,
    commentPreview: commentPreview(row.comment),
    replyStatus: row.partnerReply?.trim() ? "replied" : "not_replied",
    createdAt: toIsoString(row.createdAt),
  };
}

function mapHotelPerformance(
  row: PartnerDashboardHotelPerformanceRow
): PartnerDashboardHotelPerformance {
  return {
    hotelId: Number(row.hotel_id),
    hotelName: row.hotel_name,
    roomTypeCount: toNumber(row.room_type_count),
    roomInventory: toNumber(row.room_inventory),
    imageCount: toNumber(row.image_count),
    bookingsCount: toNumber(row.bookings_count),
    revenue: round(toNumber(row.revenue)),
    occupancyRate: round(toNumber(row.occupancy_rate)),
    averageRating: row.average_rating === null
      ? null
      : round(toNumber(row.average_rating), 2),
    totalReviews: toNumber(row.total_reviews),
  };
}

function mapTrend(rows: PartnerDashboardDailyMetricRow[]) {
  return rows.map((row) => ({
    label: row.label,
    value: round(toNumber(row.value)),
  }));
}

async function getSummary(
  partnerId: string,
  range: PartnerDashboardRange
): Promise<PartnerDashboardMetrics> {
  const occupancyDays = daysBetween(range.occupancyStart, range.occupancyEnd);
  const row = await executeRows<PartnerDashboardSummaryRow>(sql`
    with scoped_hotels as (
      select h.id
      from hotels h
      where h.partner_id = ${partnerId}
    ),
    inventory as (
      select
        count(rt.id)::int as total_room_types,
        coalesce(sum(rt.total_rooms), 0)::int as total_room_inventory
      from room_types rt
      inner join scoped_hotels sh on sh.id = rt.hotel_id
    ),
    booking_summary as (
      select
        count(b.id)::int as total_bookings,
        count(b.id) filter (
          where b.check_in_date >= ${range.today}::date
            and coalesce(b.status, 'pending') not in ('cancelled', 'expired')
        )::int as upcoming_bookings,
        count(b.id) filter (
          where coalesce(b.status, 'pending') in ('pending', 'pending_payment')
        )::int as pending_bookings,
        count(b.id) filter (where b.status = 'confirmed')::int as confirmed_bookings,
        count(b.id) filter (where b.status = 'cancelled')::int as cancelled_bookings,
        count(b.id) filter (where b.status = 'completed')::int as completed_bookings
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join scoped_hotels sh on sh.id = rt.hotel_id
    ),
    revenue_summary as (
      select
        coalesce(sum(
          rt.price_per_night * coalesce(b.rooms_count, 1) *
          greatest(b.check_out_date - b.check_in_date, 1)
        ), 0)::numeric as total_revenue
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join scoped_hotels sh on sh.id = rt.hotel_id
      where b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
    ),
    month_revenue_summary as (
      select
        coalesce(sum(
          rt.price_per_night * coalesce(b.rooms_count, 1) *
          greatest(
            least(b.check_out_date, ${range.monthEnd}::date) -
            greatest(b.check_in_date, ${range.monthStart}::date),
            0
          )
        ), 0)::numeric as revenue_this_month
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join scoped_hotels sh on sh.id = rt.hotel_id
      where b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
        and b.check_in_date < ${range.monthEnd}::date
        and b.check_out_date > ${range.monthStart}::date
    ),
    occupancy_summary as (
      select
        coalesce(sum(
          coalesce(b.rooms_count, 1) *
          greatest(
            least(b.check_out_date, ${range.occupancyEnd}::date) -
            greatest(b.check_in_date, ${range.occupancyStart}::date),
            0
          )
        ), 0)::numeric as booked_room_nights
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join scoped_hotels sh on sh.id = rt.hotel_id
      where b.status in ('confirmed', 'completed')
        and b.check_in_date < ${range.occupancyEnd}::date
        and b.check_out_date > ${range.occupancyStart}::date
    ),
    review_summary as (
      select
        avg(r.rating)::numeric as average_review_rating,
        count(r.id)::int as total_reviews,
        count(r.id) filter (
          where r.partner_reply is null or length(trim(r.partner_reply)) = 0
        )::int as unreplied_reviews_count
      from reviews r
      inner join scoped_hotels sh on sh.id = r.hotel_id
      where r.moderation_status = 'published'
    )
    select
      (select count(*)::int from scoped_hotels) as total_hotels,
      inventory.total_room_types,
      inventory.total_room_inventory,
      booking_summary.total_bookings,
      booking_summary.upcoming_bookings,
      booking_summary.pending_bookings,
      booking_summary.confirmed_bookings,
      booking_summary.cancelled_bookings,
      booking_summary.completed_bookings,
      revenue_summary.total_revenue,
      month_revenue_summary.revenue_this_month,
      case
        when inventory.total_room_inventory = 0 then 0
        else (occupancy_summary.booked_room_nights /
          (inventory.total_room_inventory * ${occupancyDays})::numeric) * 100
      end as average_occupancy_rate,
      review_summary.average_review_rating,
      review_summary.total_reviews,
      review_summary.unreplied_reviews_count,
      occupancy_summary.booked_room_nights as occupancy_booked_room_nights,
      (inventory.total_room_inventory * ${occupancyDays})::numeric
        as occupancy_available_room_nights
    from inventory, booking_summary, revenue_summary,
      month_revenue_summary, occupancy_summary, review_summary
  `).then((rows) => rows[0]);

  return mapMetrics(row);
}

function selectDashboardBookingRows() {
  return db
    .select({
      id: bookings.id,
      userEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelName: hotels.name,
      roomTypeName: roomTypes.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guestsCount: bookings.guestsCount,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id));
}

async function getRecentBookings(
  partnerId: string
): Promise<PartnerDashboardRecentBooking[]> {
  const rows = await selectDashboardBookingRows()
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(RECENT_LIMIT);

  return rows.map(mapBooking);
}

async function getUpcomingCheckIns(
  partnerId: string,
  today: string
): Promise<PartnerDashboardUpcomingCheckIn[]> {
  const rows = await selectDashboardBookingRows()
    .where(
      and(
        eq(hotels.partnerId, partnerId),
        gte(bookings.checkInDate, today),
        sql`coalesce(${bookings.status}, 'pending') not in ('cancelled', 'expired')`
      )
    )
    .orderBy(asc(bookings.checkInDate), asc(bookings.id))
    .limit(RECENT_LIMIT);

  return rows.map(mapUpcomingCheckIn);
}

async function getRecentReviews(
  partnerId: string
): Promise<PartnerDashboardRecentReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      userEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelName: hotels.name,
      rating: reviews.rating,
      comment: reviews.comment,
      partnerReply: reviews.partnerReply,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(eq(hotels.partnerId, partnerId), eq(reviews.moderationStatus, "published")))
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(REVIEW_LIMIT);

  return rows.map(mapReview);
}

async function getRevenueTrend(
  partnerId: string,
  range: PartnerDashboardRange
) {
  const rows = await executeRows<PartnerDashboardDailyMetricRow>(sql`
    with days as (
      select generate_series(
        ${range.trendStart}::date,
        ${range.trendEnd}::date,
        interval '1 day'
      )::date as day
    )
    select
      to_char(d.day, 'YYYY-MM-DD') as label,
      coalesce(revenue.value, 0)::numeric as value
    from days d
    left join lateral (
      select sum(rt.price_per_night * coalesce(b.rooms_count, 1))::numeric as value
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where h.partner_id = ${partnerId}
        and b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
        and b.check_in_date <= d.day
        and b.check_out_date > d.day
    ) revenue on true
    order by d.day
  `);

  return mapTrend(rows);
}

async function getOccupancyTrend(
  partnerId: string,
  range: PartnerDashboardRange
) {
  const rows = await executeRows<PartnerDashboardDailyMetricRow>(sql`
    with days as (
      select generate_series(
        ${range.trendStart}::date,
        ${range.trendEnd}::date,
        interval '1 day'
      )::date as day
    )
    select
      to_char(d.day, 'YYYY-MM-DD') as label,
      case
        when coalesce(inventory.value, 0) = 0 then 0
        else (coalesce(booked.value, 0)::numeric / inventory.value::numeric) * 100
      end as value
    from days d
    left join lateral (
      select sum(rt.total_rooms)::int as value
      from room_types rt
      inner join hotels h on h.id = rt.hotel_id
      where h.partner_id = ${partnerId}
    ) inventory on true
    left join lateral (
      select sum(coalesce(b.rooms_count, 1))::int as value
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where h.partner_id = ${partnerId}
        and b.status in ('confirmed', 'completed')
        and b.check_in_date <= d.day
        and b.check_out_date > d.day
    ) booked on true
    order by d.day
  `);

  return mapTrend(rows);
}

async function getHotelPerformance(
  partnerId: string,
  range: PartnerDashboardRange
): Promise<PartnerDashboardHotelPerformance[]> {
  const occupancyDays = daysBetween(range.occupancyStart, range.occupancyEnd);
  const rows = await executeRows<PartnerDashboardHotelPerformanceRow>(sql`
    with scoped_hotels as (
      select h.id, h.name
      from hotels h
      where h.partner_id = ${partnerId}
    ),
    inventory as (
      select
        rt.hotel_id,
        count(rt.id)::int as room_type_count,
        coalesce(sum(rt.total_rooms), 0)::int as room_inventory
      from room_types rt
      inner join scoped_hotels sh on sh.id = rt.hotel_id
      group by rt.hotel_id
    ),
    image_summary as (
      select hi.hotel_id, count(hi.id)::int as image_count
      from hotel_images hi
      inner join scoped_hotels sh on sh.id = hi.hotel_id
      group by hi.hotel_id
    ),
    booking_summary as (
      select
        rt.hotel_id,
        count(b.id)::int as bookings_count,
        coalesce(sum(
          rt.price_per_night * coalesce(b.rooms_count, 1) *
          greatest(b.check_out_date - b.check_in_date, 1)
        ) filter (
          where b.status in ('confirmed', 'completed')
            and b.payment_status = 'paid'
        ), 0)::numeric as revenue,
        coalesce(sum(
          coalesce(b.rooms_count, 1) *
          greatest(
            least(b.check_out_date, ${range.occupancyEnd}::date) -
            greatest(b.check_in_date, ${range.occupancyStart}::date),
            0
          )
        ) filter (
          where b.status in ('confirmed', 'completed')
            and b.check_in_date < ${range.occupancyEnd}::date
            and b.check_out_date > ${range.occupancyStart}::date
        ), 0)::numeric as booked_room_nights
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join scoped_hotels sh on sh.id = rt.hotel_id
      group by rt.hotel_id
    ),
    review_summary as (
      select
        r.hotel_id,
        avg(r.rating)::numeric as average_rating,
        count(r.id)::int as total_reviews
      from reviews r
      inner join scoped_hotels sh on sh.id = r.hotel_id
      where r.moderation_status = 'published'
      group by r.hotel_id
    )
    select
      sh.id as hotel_id,
      sh.name as hotel_name,
      coalesce(inventory.room_type_count, 0)::int as room_type_count,
      coalesce(inventory.room_inventory, 0)::int as room_inventory,
      coalesce(image_summary.image_count, 0)::int as image_count,
      coalesce(booking_summary.bookings_count, 0)::int as bookings_count,
      coalesce(booking_summary.revenue, 0)::numeric as revenue,
      case
        when coalesce(inventory.room_inventory, 0) = 0 then 0
        else (
          coalesce(booking_summary.booked_room_nights, 0) /
          (inventory.room_inventory * ${occupancyDays})::numeric
        ) * 100
      end as occupancy_rate,
      review_summary.average_rating,
      coalesce(review_summary.total_reviews, 0)::int as total_reviews
    from scoped_hotels sh
    left join inventory on inventory.hotel_id = sh.id
    left join image_summary on image_summary.hotel_id = sh.id
    left join booking_summary on booking_summary.hotel_id = sh.id
    left join review_summary on review_summary.hotel_id = sh.id
    order by revenue desc, bookings_count desc, sh.name asc
    limit ${HOTEL_PERFORMANCE_LIMIT}
  `);

  return rows.map(mapHotelPerformance);
}

export async function getPartnerDashboard(
  userId: string
): Promise<PartnerDashboardResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const range = getDashboardRange();

  const [
    metrics,
    recentBookings,
    upcomingCheckIns,
    recentReviews,
    revenueTrend,
    occupancyTrend,
    hotelPerformance,
  ] = await Promise.all([
    getSummary(partnerId, range),
    getRecentBookings(partnerId),
    getUpcomingCheckIns(partnerId, range.today),
    getRecentReviews(partnerId),
    getRevenueTrend(partnerId, range),
    getOccupancyTrend(partnerId, range),
    getHotelPerformance(partnerId, range),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    recentBookings,
    upcomingCheckIns,
    recentReviews,
    revenueTrend,
    occupancyTrend,
    hotelPerformance,
  };
}
