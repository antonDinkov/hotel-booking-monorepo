import "server-only";

import { sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import type {
  AdminOccupancySummary,
  AdminReportChartPoint,
  AdminReportDistributionPoint,
  AdminReportFilters,
  AdminReportMetric,
  AdminReportRankingItem,
  AdminReportsResult,
  AdminReportSummary,
} from "@/types/admin-reports";

const STATUS_LABELS = ["pending", "confirmed", "cancelled", "completed"] as const;
const VERIFICATION_LABELS = ["verified", "pending", "rejected", "suspended"] as const;
const RATING_VALUES = [5, 4, 3, 2, 1] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type QueryRow = Record<string, unknown>;

async function executeRows<T extends QueryRow>(query: SQL): Promise<T[]> {
  const result = await db.execute<T>(query);
  return result.rows;
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function countDays(dateFrom: string, dateTo: string): number {
  const start = parseDateOnly(dateFrom).getTime();
  const end = parseDateOnly(dateTo).getTime();
  return Math.max(1, Math.floor((end - start) / MS_PER_DAY) + 1);
}

function dateEndExclusive(dateTo: string): string {
  return formatDateOnly(addDays(parseDateOnly(dateTo), 1));
}

function buildDateRange(filters: AdminReportFilters): string[] {
  const dates: string[] = [];
  for (
    let date = parseDateOnly(filters.dateFrom);
    formatDateOnly(date) <= filters.dateTo;
    date = addDays(date, 1)
  ) {
    dates.push(formatDateOnly(date));
  }

  return dates;
}

function mergeDailyRows(
  rows: { label: unknown; value: unknown }[],
  filters: AdminReportFilters
): AdminReportChartPoint[] {
  const values = new Map(rows.map((row) => [String(row.label), toNumber(row.value)]));
  return buildDateRange(filters).map((label) => ({
    label,
    value: round(values.get(label) ?? 0),
  }));
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function numberFormat(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function percent(value: number): string {
  return `${round(value, 1)}%`;
}

function statusTone(status: string): AdminReportDistributionPoint["tone"] {
  if (status === "confirmed" || status === "completed" || status === "verified") return "blue";
  if (status === "cancelled" || status === "rejected" || status === "suspended") return "red";
  return "amber";
}

function ratingTone(rating: number): AdminReportDistributionPoint["tone"] {
  if (rating >= 4) return "blue";
  if (rating === 3) return "amber";
  return "red";
}

async function getPlatformSummary(
  occupancy: AdminOccupancySummary
): Promise<AdminReportSummary> {
  const monthStart = formatDateOnly(startOfMonth(new Date()));
  const monthEnd = dateEndExclusive(formatDateOnly(new Date()));
  const row = await executeRows<Record<string, unknown>>(sql`
    with revenue as (
      select
        coalesce(sum(rt.price_per_night * coalesce(b.rooms_count, 1) *
          greatest(b.check_out_date - b.check_in_date, 1)
        ), 0)::numeric as total_revenue
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      where b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
    ),
    month_revenue as (
      select
        coalesce(sum(rt.price_per_night * coalesce(b.rooms_count, 1) *
          greatest(
            least(b.check_out_date, ${monthEnd}::date) -
            greatest(b.check_in_date, ${monthStart}::date),
            0
          )
        ), 0)::numeric as revenue_this_month
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      where b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
        and b.check_in_date < ${monthEnd}::date
        and b.check_out_date > ${monthStart}::date
    )
    select
      (select count(*)::int from users) as total_users,
      (select count(distinct ur.user_id)::int from user_roles ur
        inner join roles r on r.id = ur.role_id where r.name = 'client') as total_clients,
      (select count(*)::int from partners) as total_partners,
      (select count(*)::int from partners where is_verified = true) as verified_partners,
      (select count(*)::int from partners where verification_status = 'pending') as pending_partners,
      (select count(*)::int from hotels) as total_hotels,
      (select coalesce(sum(total_rooms), 0)::int from room_types) as total_room_inventory,
      (select count(*)::int from bookings) as total_bookings,
      (select count(*)::int from bookings where status = 'confirmed') as confirmed_bookings,
      (select count(*)::int from bookings where status = 'cancelled') as cancelled_bookings,
      (select count(*)::int from bookings where status = 'completed') as completed_bookings,
      (select total_revenue from revenue) as total_revenue,
      (select revenue_this_month from month_revenue) as revenue_this_month,
      (select avg(rating)::numeric from reviews where moderation_status = 'published') as average_review_rating,
      (select count(*)::int from reviews) as total_reviews,
      (select count(*)::int from reviews where moderation_status = 'hidden') as hidden_reviews
  `).then((rows) => rows[0] ?? {});

  return {
    totalUsers: toNumber(row.total_users),
    totalClients: toNumber(row.total_clients),
    totalPartners: toNumber(row.total_partners),
    verifiedPartners: toNumber(row.verified_partners),
    pendingPartners: toNumber(row.pending_partners),
    totalHotels: toNumber(row.total_hotels),
    totalRoomInventory: toNumber(row.total_room_inventory),
    totalBookings: toNumber(row.total_bookings),
    confirmedBookings: toNumber(row.confirmed_bookings),
    cancelledBookings: toNumber(row.cancelled_bookings),
    completedBookings: toNumber(row.completed_bookings),
    totalRevenue: round(toNumber(row.total_revenue)),
    revenueThisMonth: round(toNumber(row.revenue_this_month)),
    averageOccupancy: occupancy.averageRate,
    averageReviewRating: row.average_review_rating === null ? null : round(toNumber(row.average_review_rating), 2),
    totalReviews: toNumber(row.total_reviews),
    hiddenReviews: toNumber(row.hidden_reviews),
  };
}

async function getRevenueOverTime(
  filters: AdminReportFilters
): Promise<AdminReportChartPoint[]> {
  const rows = await executeRows<{ label: string; value: string | number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as label, coalesce(revenue.value, 0)::numeric as value
    from days d
    left join lateral (
      select sum(rt.price_per_night * coalesce(b.rooms_count, 1))::numeric as value
      from bookings b
      inner join room_types rt on rt.id = b.room_type_id
      where b.check_in_date <= d.day
        and b.check_out_date > d.day
        and b.status in ('confirmed', 'completed')
        and b.payment_status = 'paid'
    ) revenue on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getBookingsOverTime(
  filters: AdminReportFilters
): Promise<AdminReportChartPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    with days as (
      select generate_series(${filters.dateFrom}::date, ${filters.dateTo}::date, interval '1 day')::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as label, coalesce(counts.value, 0)::int as value
    from days d
    left join lateral (
      select count(*)::int as value
      from bookings b
      where b.created_at >= d.day
        and b.created_at < d.day + interval '1 day'
        and coalesce(b.status, 'pending') not in ('cancelled', 'expired')
    ) counts on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getBookingStatusDistribution(
  filters: AdminReportFilters
): Promise<AdminReportDistributionPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    select
      case
        when status in ('pending', 'pending_payment') then 'pending'
        when status in ('confirmed', 'cancelled', 'completed') then status
        else 'pending'
      end as label,
      count(*)::int as value
    from bookings
    where created_at >= ${filters.dateFrom}::date
      and created_at < ${dateEndExclusive(filters.dateTo)}::date
    group by 1
  `);
  const values = new Map(rows.map((row) => [row.label, toNumber(row.value)]));

  return STATUS_LABELS.map((label) => ({
    label,
    value: values.get(label) ?? 0,
    tone: statusTone(label),
  }));
}

async function getPartnerVerificationDistribution(): Promise<AdminReportDistributionPoint[]> {
  const rows = await executeRows<{ label: string; value: number }>(sql`
    select verification_status as label, count(*)::int as value
    from partners
    group by verification_status
  `);
  const values = new Map(rows.map((row) => [row.label, toNumber(row.value)]));

  return VERIFICATION_LABELS.map((label) => ({
    label,
    value: values.get(label) ?? 0,
    tone: statusTone(label),
  }));
}

async function getTopHotelsByBookings(
  filters: AdminReportFilters
): Promise<AdminReportRankingItem[]> {
  const rows = await executeRows<{ id: number; name: string; value: number }>(sql`
    select h.id, h.name, count(b.id)::int as value
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    where b.created_at >= ${filters.dateFrom}::date
      and b.created_at < ${dateEndExclusive(filters.dateTo)}::date
      and coalesce(b.status, 'pending') not in ('cancelled', 'expired')
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

async function getTopPartnersByRevenue(
  filters: AdminReportFilters
): Promise<AdminReportRankingItem[]> {
  const rows = await executeRows<{ id: string; name: string; value: string | number }>(sql`
    select
      p.id,
      p.company_name as name,
      coalesce(sum(rt.price_per_night * coalesce(b.rooms_count, 1) *
        greatest(
          least(b.check_out_date, ${dateEndExclusive(filters.dateTo)}::date) -
          greatest(b.check_in_date, ${filters.dateFrom}::date),
          0
        )
      ), 0)::numeric as value
    from bookings b
    inner join room_types rt on rt.id = b.room_type_id
    inner join hotels h on h.id = rt.hotel_id
    inner join partners p on p.id = h.partner_id
    where b.status in ('confirmed', 'completed')
      and b.payment_status = 'paid'
      and b.check_in_date < ${dateEndExclusive(filters.dateTo)}::date
      and b.check_out_date > ${filters.dateFrom}::date
    group by p.id, p.company_name
    order by value desc, p.company_name asc
    limit 8
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: round(toNumber(row.value)),
    detail: currency(toNumber(row.value)),
  }));
}

async function getReviewRatingDistribution(
  filters: AdminReportFilters
): Promise<AdminReportDistributionPoint[]> {
  const rows = await executeRows<{ label: number; value: number }>(sql`
    select rating as label, count(*)::int as value
    from reviews
    where created_at >= ${filters.dateFrom}::date
      and created_at < ${dateEndExclusive(filters.dateTo)}::date
    group by rating
  `);
  const values = new Map(rows.map((row) => [Number(row.label), toNumber(row.value)]));

  return RATING_VALUES.map((rating) => ({
    label: `${rating} star`,
    value: values.get(rating) ?? 0,
    tone: ratingTone(rating),
  }));
}

async function getOccupancySummary(
  filters: AdminReportFilters
): Promise<AdminOccupancySummary> {
  const days = countDays(filters.dateFrom, filters.dateTo);
  const [daily, totals] = await Promise.all([
    getOccupancyDaily(filters),
    getOccupancyTotals(filters, days),
  ]);
  const averageRate = totals.availableRoomNights > 0
    ? round((totals.bookedRoomNights / totals.availableRoomNights) * 100)
    : 0;

  return { averageRate, daily, ...totals };
}

async function getOccupancyDaily(
  filters: AdminReportFilters
): Promise<AdminReportChartPoint[]> {
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
      select coalesce(sum(total_rooms), 0)::int as value from room_types
    ) inventory on true
    left join lateral (
      select coalesce(sum(coalesce(b.rooms_count, 1)), 0)::int as value
      from bookings b
      where b.check_in_date <= d.day
        and b.check_out_date > d.day
        and (
          b.status in ('confirmed', 'completed')
          or (b.status in ('pending', 'pending_payment') and b.expires_at > now())
        )
    ) booked on true
    order by d.day
  `);

  return mergeDailyRows(rows, filters);
}

async function getOccupancyTotals(filters: AdminReportFilters, days: number) {
  const row = await executeRows<{
    booked_room_nights: string | number;
    available_room_nights: string | number;
  }>(sql`
    with inventory as (
      select coalesce(sum(total_rooms), 0)::numeric * ${days} as available_room_nights
      from room_types
    ),
    booked as (
      select coalesce(sum(coalesce(b.rooms_count, 1) *
        greatest(
          least(b.check_out_date, ${dateEndExclusive(filters.dateTo)}::date) -
          greatest(b.check_in_date, ${filters.dateFrom}::date),
          0
        )
      ), 0)::numeric as booked_room_nights
      from bookings b
      where b.check_in_date < ${dateEndExclusive(filters.dateTo)}::date
        and b.check_out_date > ${filters.dateFrom}::date
        and (
          b.status in ('confirmed', 'completed')
          or (b.status in ('pending', 'pending_payment') and b.expires_at > now())
        )
    )
    select booked.booked_room_nights, inventory.available_room_nights
    from booked cross join inventory
  `).then((rows) => rows[0]);

  return {
    bookedRoomNights: round(toNumber(row?.booked_room_nights)),
    availableRoomNights: round(toNumber(row?.available_room_nights)),
  };
}

function buildMetrics(summary: AdminReportSummary): AdminReportMetric[] {
  return [
    { label: "Total users", value: numberFormat(summary.totalUsers), detail: "All registered accounts", tone: "blue" },
    { label: "Clients", value: numberFormat(summary.totalClients), detail: "Client role accounts", tone: "neutral" },
    { label: "Partners", value: numberFormat(summary.totalPartners), detail: `${summary.verifiedPartners} verified / ${summary.pendingPartners} pending`, tone: "amber" },
    { label: "Hotels", value: numberFormat(summary.totalHotels), detail: `${numberFormat(summary.totalRoomInventory)} rooms in inventory`, tone: "blue" },
    { label: "Bookings", value: numberFormat(summary.totalBookings), detail: `${summary.confirmedBookings} confirmed / ${summary.cancelledBookings} cancelled`, tone: "neutral" },
    { label: "Completed", value: numberFormat(summary.completedBookings), detail: "Finished stays", tone: "blue" },
    { label: "Total revenue", value: currency(summary.totalRevenue), detail: "Paid confirmed/completed stays", tone: "blue" },
    { label: "Revenue this month", value: currency(summary.revenueThisMonth), detail: "Paid room nights this month", tone: "blue" },
    { label: "Occupancy", value: percent(summary.averageOccupancy), detail: "Selected range average", tone: "amber" },
    { label: "Review rating", value: summary.averageReviewRating?.toFixed(2) ?? "No data", detail: `${summary.totalReviews} total reviews`, tone: "neutral" },
    { label: "Hidden reviews", value: numberFormat(summary.hiddenReviews), detail: "Moderation-hidden reviews", tone: summary.hiddenReviews ? "red" : "neutral" },
  ];
}

export async function getAdminReports(
  filters: AdminReportFilters
): Promise<AdminReportsResult> {
  const [
    revenueOverTime,
    bookingsOverTime,
    bookingStatusDistribution,
    partnerVerificationDistribution,
    topHotelsByBookings,
    topPartnersByRevenue,
    reviewRatingDistribution,
    occupancySummary,
  ] = await Promise.all([
    getRevenueOverTime(filters),
    getBookingsOverTime(filters),
    getBookingStatusDistribution(filters),
    getPartnerVerificationDistribution(),
    getTopHotelsByBookings(filters),
    getTopPartnersByRevenue(filters),
    getReviewRatingDistribution(filters),
    getOccupancySummary(filters),
  ]);
  const summary = await getPlatformSummary(occupancySummary);

  return {
    filters,
    metrics: buildMetrics(summary),
    summary,
    revenueOverTime,
    bookingsOverTime,
    bookingStatusDistribution,
    partnerVerificationDistribution,
    topHotelsByBookings,
    topPartnersByRevenue,
    reviewRatingDistribution,
    occupancySummary,
  };
}
