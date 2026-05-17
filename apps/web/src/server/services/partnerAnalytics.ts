import { asc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { hotels, roomTypes } from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type {
  PartnerAnalyticsChartPoint,
  PartnerAnalyticsDistributionPoint,
  PartnerAnalyticsFilters,
  PartnerAnalyticsOptions,
  PartnerAnalyticsRankingItem,
  PartnerAnalyticsResult,
  PartnerBookingAnalytics,
  PartnerOccupancyAnalytics,
  PartnerRevenueAnalytics,
  PartnerReviewAnalytics,
  PartnerAnalyticsSummary,
} from "@/types/partner-analytics";

const STATUS_LABELS = ["pending", "confirmed", "cancelled", "completed"] as const;
const RATING_VALUES = [5, 4, 3, 2, 1] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type QueryRow = Record<string, unknown>;

async function executeRows<T extends QueryRow>(query: SQL): Promise<T[]> {
  const result = await db.execute<T>(query);
  return result.rows;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return start;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dateEndExclusive(dateTo: string): string {
  return formatDateOnly(addDays(parseDateOnly(dateTo), 1));
}

function countDays(dateFrom: string, dateTo: string): number {
  const start = parseDateOnly(dateFrom).getTime();
  const end = parseDateOnly(dateTo).getTime();
  return Math.max(1, Math.floor((end - start) / MS_PER_DAY) + 1);
}

function buildDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  for (let date = parseDateOnly(dateFrom); formatDateOnly(date) <= dateTo; date = addDays(date, 1)) {
    dates.push(formatDateOnly(date));
  }
  return dates;
}

function mergeDailyRows(
  rows: { label: unknown; value: unknown }[],
  filters: PartnerAnalyticsFilters
): PartnerAnalyticsChartPoint[] {
  const values = new Map(rows.map((row) => [String(row.label), toNumber(row.value)]));
  return buildDateRange(filters.dateFrom, filters.dateTo).map((label) => ({
    label,
    value: round(values.get(label) ?? 0),
  }));
}

function aggregatePoints(
  points: PartnerAnalyticsChartPoint[],
  period: "week" | "month",
  mode: "sum" | "average" = "sum"
): PartnerAnalyticsChartPoint[] {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const point of points) {
    const date = parseDateOnly(point.label);
    const key = period === "week" ? formatDateOnly(startOfWeek(date)) : point.label.slice(0, 7);
    const current = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, { total: current.total + point.value, count: current.count + 1 });
  }

  return [...grouped.entries()].map(([label, value]) => ({
    label,
    value: round(mode === "average" ? value.total / value.count : value.total),
  }));
}

function scopeWhere(partnerId: string, filters: PartnerAnalyticsFilters): SQL {
  const conditions: SQL[] = [sql`h.partner_id = ${partnerId}`];
  if (filters.hotelId) conditions.push(sql`h.id = ${filters.hotelId}`);
  if (filters.roomTypeId) conditions.push(sql`rt.id = ${filters.roomTypeId}`);
  return sql.join(conditions, sql` and `);
}

function timestampRangeSql(alias: "b" | "r", filters: PartnerAnalyticsFilters): SQL {
  const start = parseDateOnly(filters.dateFrom);
  const end = addDays(parseDateOnly(filters.dateTo), 1);
  return alias === "b"
    ? sql`b.created_at >= ${start} and b.created_at < ${end}`
    : sql`r.created_at >= ${start} and r.created_at < ${end}`;
}

function bookingStatusConditionSql(status: PartnerAnalyticsFilters["status"]): SQL {
  if (status === "pending") return sql`b.status in ('pending', 'pending_payment')`;
  return sql`b.status = ${status}`;
}

function optionalBookingStatusSql(filters: PartnerAnalyticsFilters): SQL {
  return filters.status
    ? sql`and ${bookingStatusConditionSql(filters.status)}`
    : sql.empty();
}

function bookingActivityStatusSql(filters: PartnerAnalyticsFilters): SQL {
  if (filters.status) return optionalBookingStatusSql(filters);
  return sql`and coalesce(b.status, 'pending') not in ('cancelled', 'expired')`;
}

function revenueStatusSql(filters: PartnerAnalyticsFilters): SQL {
  return sql`
    and b.status in ('confirmed', 'completed')
    and b.payment_status = 'paid'
    ${optionalBookingStatusSql(filters)}
  `;
}

function occupancyStatusSql(filters: PartnerAnalyticsFilters): SQL {
  if (!filters.status) return sql`and b.status in ('confirmed', 'completed')`;
  if (filters.status === "cancelled") return sql`and false`;
  return optionalBookingStatusSql(filters);
}

async function getAnalyticsOptions(partnerId: string): Promise<PartnerAnalyticsOptions> {
  const [hotelRows, roomRows] = await Promise.all([
    db
      .select({ id: hotels.id, name: hotels.name })
      .from(hotels)
      .where(eq(hotels.partnerId, partnerId))
      .orderBy(asc(hotels.name)),
    db
      .select({
        id: roomTypes.id,
        hotelId: hotels.id,
        hotelName: hotels.name,
        name: roomTypes.name,
      })
      .from(roomTypes)
      .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
      .where(eq(hotels.partnerId, partnerId))
      .orderBy(asc(hotels.name), asc(roomTypes.name)),
  ]);

  return { hotels: hotelRows, roomTypes: roomRows };
}

async function getRevenueDaily(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsChartPoint[]> {
  const rows = await executeRows<{ label: string; value: string | number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
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
      where ${scopeWhere(partnerId, filters)}
        and b.check_in_date <= d.day
        and b.check_out_date > d.day
        ${revenueStatusSql(filters)}
    ) revenue on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getRevenueForRange(
  partnerId: string,
  filters: PartnerAnalyticsFilters,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const scopedFilters = { ...filters, dateFrom, dateTo };
  const daily = await getRevenueDaily(partnerId, scopedFilters);
  return round(daily.reduce((total, point) => total + point.value, 0));
}

async function getRevenueAnalytics(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerRevenueAnalytics> {
  const today = new Date();
  const daily = await getRevenueDaily(partnerId, filters);
  const [todayRevenue, weekRevenue, monthRevenue, yearRevenue] = await Promise.all([
    getRevenueForRange(partnerId, filters, formatDateOnly(today), formatDateOnly(today)),
    getRevenueForRange(partnerId, filters, formatDateOnly(startOfWeek(today)), formatDateOnly(today)),
    getRevenueForRange(partnerId, filters, formatDateOnly(startOfMonth(today)), formatDateOnly(today)),
    getRevenueForRange(partnerId, filters, formatDateOnly(startOfYear(today)), formatDateOnly(today)),
  ]);

  return {
    total: round(daily.reduce((total, point) => total + point.value, 0)),
    today: todayRevenue,
    thisWeek: weekRevenue,
    thisMonth: monthRevenue,
    thisYear: yearRevenue,
    daily,
    weekly: aggregatePoints(daily, "week"),
    monthly: aggregatePoints(daily, "month"),
  };
}

async function getBookingDaily(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsChartPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as label, coalesce(counts.value, 0)::int as value
    from days d
    left join lateral (
      select count(*)::int as value
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
        and ${timestampRangeSql("b", filters)}
        and b.created_at >= d.day
        and b.created_at < d.day + interval '1 day'
        ${bookingActivityStatusSql(filters)}
    ) counts on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

function statusTone(status: string): PartnerAnalyticsDistributionPoint["tone"] {
  if (status === "confirmed" || status === "completed") return "emerald";
  if (status === "cancelled") return "rose";
  return "amber";
}

async function getBookingStatusDistribution(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsDistributionPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    select
      case
        when b.status in ('pending', 'pending_payment') then 'pending'
        when b.status in ('confirmed', 'cancelled', 'completed') then b.status
        else 'pending'
      end as label,
      count(*)::int as value
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and ${timestampRangeSql("b", filters)}
      ${optionalBookingStatusSql(filters)}
    group by label
  `);
  const values = new Map(rows.map((row) => [row.label, toNumber(row.value)]));

  return STATUS_LABELS.map((label) => ({
    label,
    value: values.get(label) ?? 0,
    tone: statusTone(label),
  }));
}

async function getBookingsByHotel(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsRankingItem[]> {
  const rows = await executeRows<{ id: number; name: string; value: number }>(sql`
    select h.id, h.name, count(b.id)::int as value
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and ${timestampRangeSql("b", filters)}
      ${bookingActivityStatusSql(filters)}
    group by h.id, h.name
    order by value desc, h.name asc
    limit 8
  `);

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    value: toNumber(row.value),
    detail: `${toNumber(row.value)} bookings`,
  }));
}

async function getBookingsByRoomType(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsRankingItem[]> {
  const rows = await executeRows<{ id: number; name: string; hotel_name: string; value: number }>(sql`
    select rt.id, rt.name, h.name as hotel_name, count(b.id)::int as value
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and ${timestampRangeSql("b", filters)}
      ${bookingActivityStatusSql(filters)}
    group by rt.id, rt.name, h.name
    order by value desc, rt.name asc
    limit 8
  `);

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    value: toNumber(row.value),
    detail: row.hotel_name,
  }));
}

async function getBookingAnalytics(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerBookingAnalytics> {
  const [daily, statusDistribution, byHotel, byRoomType] = await Promise.all([
    getBookingDaily(partnerId, filters),
    getBookingStatusDistribution(partnerId, filters),
    getBookingsByHotel(partnerId, filters),
    getBookingsByRoomType(partnerId, filters),
  ]);

  return {
    daily,
    weekly: aggregatePoints(daily, "week"),
    monthly: aggregatePoints(daily, "month"),
    statusDistribution,
    byHotel,
    byRoomType,
  };
}

async function getOccupancyDaily(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsChartPoint[]> {
  const rows = await executeRows<{ label: string; value: string | number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
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
      where ${scopeWhere(partnerId, filters)}
    ) inventory on true
    left join lateral (
      select sum(coalesce(b.rooms_count, 1))::int as value
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
        and b.check_in_date <= d.day
        and b.check_out_date > d.day
        ${occupancyStatusSql(filters)}
    ) booked on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getOccupancyByHotel(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsRankingItem[]> {
  const days = countDays(filters.dateFrom, filters.dateTo);
  const rows = await executeRows<{ id: number; name: string; booked: number; available: number }>(sql`
    with inventory as (
      select h.id, h.name, sum(rt.total_rooms)::int * ${days} as available
      from room_types rt
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
      group by h.id, h.name
    ),
    booked as (
      select
        h.id,
        sum(coalesce(b.rooms_count, 1) * greatest(
          least(b.check_out_date, ${dateEndExclusive(filters.dateTo)}::date) -
          greatest(b.check_in_date, ${filters.dateFrom}::date),
          0
        ))::int as booked
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
        and b.check_in_date < ${dateEndExclusive(filters.dateTo)}::date
        and b.check_out_date > ${filters.dateFrom}::date
        ${occupancyStatusSql(filters)}
      group by h.id
    )
    select inventory.id, inventory.name, coalesce(booked.booked, 0)::int as booked, inventory.available
    from inventory
    left join booked on booked.id = inventory.id
  `);

  return rows.map((row) => toOccupancyRanking(row.id, row.name, row.booked, row.available));
}

async function getOccupancyByRoomType(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsRankingItem[]> {
  const days = countDays(filters.dateFrom, filters.dateTo);
  const rows = await executeRows<{ id: number; name: string; booked: number; available: number }>(sql`
    with inventory as (
      select rt.id, rt.name, (rt.total_rooms * ${days})::int as available
      from room_types rt
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
    ),
    booked as (
      select
        rt.id,
        sum(coalesce(b.rooms_count, 1) * greatest(
          least(b.check_out_date, ${dateEndExclusive(filters.dateTo)}::date) -
          greatest(b.check_in_date, ${filters.dateFrom}::date),
          0
        ))::int as booked
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
        and b.check_in_date < ${dateEndExclusive(filters.dateTo)}::date
        and b.check_out_date > ${filters.dateFrom}::date
        ${occupancyStatusSql(filters)}
      group by rt.id
    )
    select inventory.id, inventory.name, coalesce(booked.booked, 0)::int as booked, inventory.available
    from inventory
    left join booked on booked.id = inventory.id
  `);

  return rows.map((row) => toOccupancyRanking(row.id, row.name, row.booked, row.available));
}

function toOccupancyRanking(
  id: number,
  name: string,
  booked: unknown,
  available: unknown
): PartnerAnalyticsRankingItem {
  const bookedValue = toNumber(booked);
  const availableValue = toNumber(available);
  const value = availableValue > 0 ? round((bookedValue / availableValue) * 100) : 0;
  return {
    id: Number(id),
    name,
    value,
    detail: `${bookedValue}/${availableValue} room nights`,
  };
}

async function getOccupancyAnalytics(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerOccupancyAnalytics> {
  const [trend, byHotel, byRoomType] = await Promise.all([
    getOccupancyDaily(partnerId, filters),
    getOccupancyByHotel(partnerId, filters),
    getOccupancyByRoomType(partnerId, filters),
  ]);
  const averageRate = trend.length
    ? round(trend.reduce((total, point) => total + point.value, 0) / trend.length)
    : 0;

  return {
    averageRate,
    trend,
    mostOccupiedHotels: [...byHotel].sort((a, b) => b.value - a.value).slice(0, 5),
    leastOccupiedHotels: [...byHotel].sort((a, b) => a.value - b.value).slice(0, 5),
    byRoomType: [...byRoomType].sort((a, b) => b.value - a.value).slice(0, 8),
  };
}

async function getReviewDaily(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsChartPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as label, coalesce(counts.value, 0)::int as value
    from days d
    left join lateral (
      select count(*)::int as value
      from reviews r
      inner join bookings b on b.id = r.booking_id
      inner join room_types rt on rt.id = b.room_type_id
      inner join hotels h on h.id = rt.hotel_id
      where ${scopeWhere(partnerId, filters)}
        and r.moderation_status = 'published'
        and r.created_at >= d.day
        and r.created_at < d.day + interval '1 day'
    ) counts on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getReviewDistribution(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsDistributionPoint[]> {
  const rows = await executeRows<{ label: number; value: number }>(sql`
    select r.rating as label, count(*)::int as value
    from reviews r
    inner join bookings b on b.id = r.booking_id
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and r.moderation_status = 'published'
      and ${timestampRangeSql("r", filters)}
    group by r.rating
  `);
  const values = new Map(rows.map((row) => [Number(row.label), toNumber(row.value)]));

  return RATING_VALUES.map((rating) => ({
    label: `${rating} star`,
    value: values.get(rating) ?? 0,
    tone: rating >= 4 ? "emerald" : rating === 3 ? "amber" : "rose",
  }));
}

async function getReviewSummary(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<Pick<PartnerReviewAnalytics, "averageRating" | "totalReviews">> {
  const row = await executeRows<{ average: string | null; total: number }>(sql`
    select avg(r.rating)::numeric as average, count(*)::int as total
    from reviews r
    inner join bookings b on b.id = r.booking_id
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and r.moderation_status = 'published'
      and ${timestampRangeSql("r", filters)}
  `).then((rows) => rows[0]);

  return {
    averageRating: row?.average === null ? null : round(toNumber(row?.average), 2),
    totalReviews: toNumber(row?.total),
  };
}

async function getRatedHotels(
  partnerId: string,
  filters: PartnerAnalyticsFilters,
  direction: "best" | "lowest"
): Promise<PartnerAnalyticsRankingItem[]> {
  const order = direction === "best" ? sql`average desc` : sql`average asc`;
  const rows = await executeRows<{ id: number; name: string; average: string; total: number }>(sql`
    select h.id, h.name, avg(r.rating)::numeric as average, count(*)::int as total
    from reviews r
    inner join bookings b on b.id = r.booking_id
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where ${scopeWhere(partnerId, filters)}
      and r.moderation_status = 'published'
      and ${timestampRangeSql("r", filters)}
    group by h.id, h.name
    order by ${order}, total desc, h.name asc
    limit 5
  `);

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    value: round(toNumber(row.average), 2),
    detail: `${toNumber(row.total)} reviews`,
  }));
}

async function getReviewAnalytics(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerReviewAnalytics> {
  const [summary, trend, ratingDistribution, bestRatedHotels, lowestRatedHotels] =
    await Promise.all([
      getReviewSummary(partnerId, filters),
      getReviewDaily(partnerId, filters),
      getReviewDistribution(partnerId, filters),
      getRatedHotels(partnerId, filters, "best"),
      getRatedHotels(partnerId, filters, "lowest"),
    ]);

  return { ...summary, trend, ratingDistribution, bestRatedHotels, lowestRatedHotels };
}

async function getBookingTotals(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<{ total: number; pending: number; cancelled: number; completed: number }> {
  const distribution = await getBookingStatusDistribution(partnerId, filters);
  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  return {
    total,
    pending: distribution.find((item) => item.label === "pending")?.value ?? 0,
    cancelled: distribution.find((item) => item.label === "cancelled")?.value ?? 0,
    completed: distribution.find((item) => item.label === "completed")?.value ?? 0,
  };
}

async function getInventorySummary(
  partnerId: string,
  filters: PartnerAnalyticsFilters
): Promise<{ activeHotels: number; totalRoomInventory: number }> {
  const row = await executeRows<{ active_hotels: number; total_rooms: number }>(sql`
    select
      count(distinct h.id)::int as active_hotels,
      coalesce(sum(rt.total_rooms), 0)::int as total_rooms
    from hotels h
    left join room_types rt on rt.hotel_id = h.id
    where h.partner_id = ${partnerId}
      ${filters.hotelId ? sql`and h.id = ${filters.hotelId}` : sql.empty()}
      ${filters.roomTypeId ? sql`and rt.id = ${filters.roomTypeId}` : sql.empty()}
  `).then((rows) => rows[0]);

  return {
    activeHotels: toNumber(row?.active_hotels),
    totalRoomInventory: toNumber(row?.total_rooms),
  };
}

async function getSummary(
  partnerId: string,
  filters: PartnerAnalyticsFilters,
  revenue: PartnerRevenueAnalytics,
  occupancy: PartnerOccupancyAnalytics,
  reviews: PartnerReviewAnalytics
): Promise<PartnerAnalyticsSummary> {
  const [bookingTotals, inventory] = await Promise.all([
    getBookingTotals(partnerId, filters),
    getInventorySummary(partnerId, filters),
  ]);

  return {
    totalBookings: bookingTotals.total,
    totalRevenue: revenue.total,
    averageOccupancyRate: occupancy.averageRate,
    averageReviewRating: reviews.averageRating,
    totalReviews: reviews.totalReviews,
    pendingBookings: bookingTotals.pending,
    cancelledBookings: bookingTotals.cancelled,
    completedBookings: bookingTotals.completed,
    activeHotels: inventory.activeHotels,
    totalRoomInventory: inventory.totalRoomInventory,
  };
}

export async function getPartnerRevenueAnalytics(
  userId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerRevenueAnalytics> {
  const partnerId = await getPartnerIdForUser(userId);
  return getRevenueAnalytics(partnerId, filters);
}

export async function getPartnerBookingAnalytics(
  userId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerBookingAnalytics> {
  const partnerId = await getPartnerIdForUser(userId);
  return getBookingAnalytics(partnerId, filters);
}

export async function getPartnerOccupancyAnalytics(
  userId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerOccupancyAnalytics> {
  const partnerId = await getPartnerIdForUser(userId);
  return getOccupancyAnalytics(partnerId, filters);
}

export async function getPartnerReviewAnalytics(
  userId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerReviewAnalytics> {
  const partnerId = await getPartnerIdForUser(userId);
  return getReviewAnalytics(partnerId, filters);
}

export async function getPartnerAnalytics(
  userId: string,
  filters: PartnerAnalyticsFilters
): Promise<PartnerAnalyticsResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const [options, revenue, bookings, occupancy, reviews] = await Promise.all([
    getAnalyticsOptions(partnerId),
    getRevenueAnalytics(partnerId, filters),
    getBookingAnalytics(partnerId, filters),
    getOccupancyAnalytics(partnerId, filters),
    getReviewAnalytics(partnerId, filters),
  ]);
  const summary = await getSummary(partnerId, filters, revenue, occupancy, reviews);

  return { filters, options, summary, revenue, bookings, occupancy, reviews };
}
