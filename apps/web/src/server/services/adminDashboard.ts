import "server-only";

import { desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotels,
  partners,
  reviews,
  roles,
  roomTypes,
  userProfiles,
  userRoles,
  users,
} from "@/db/schema";
import { parseAdminReportFilters } from "@/lib/admin-report-validation";
import { formatDateOnly } from "@/lib/date-only";
import {
  calculateBookingTotal,
  getBookingRoomsCount,
} from "@/server/services/bookingCalculations";
import { adminPartnerVerificationStatuses } from "@/lib/admin-partner-validation";
import { getAdminReports } from "@/server/services/adminReports";
import { getAdminSystemStatus } from "@/server/services/adminSystem";
import type { AdminStatCardProps } from "@/types/admin";
import type {
  AdminDashboardMetrics,
  AdminDashboardPartner,
  AdminDashboardRecentBooking,
  AdminDashboardRecentReview,
  AdminDashboardRecentUser,
  AdminDashboardResult,
  AdminDashboardSummaryItem,
} from "@/types/admin-dashboard";
import type { AdminPartnerVerificationStatus } from "@/types/admin-partners";
import type { BookingPaymentStatus } from "@/types/booking";
import type { ReviewModerationStatus } from "@/types/review";

const DASHBOARD_LIMIT = 6;
const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

type QueryRow = Record<string, unknown>;

type MetricExtraRow = {
  total_room_types: number;
  pending_bookings: number;
  published_reviews: number;
  recent_payments_count: number;
};

type RecentBookingRow = {
  id: number;
  guestUserId: string;
  guestEmail: string;
  guestFullName: string | null;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeName: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  roomsCount: number | null;
  status: string | null;
  paymentStatus: string | null;
  createdAt: string | Date | null;
  pricePerNight: number;
};

type RecentReviewRow = {
  id: number;
  userId: string;
  guestEmail: string;
  guestFullName: string | null;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  partnerReply: string | null;
  createdAt: string | Date;
};

async function executeRows<T extends QueryRow>(query: SQL): Promise<T[]> {
  const result = await db.execute<T>(query);
  return result.rows;
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateString(value: Date | string): string {
  return value instanceof Date ? formatDateOnly(value) : value.slice(0, 10);
}

function displayName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || "Guest";
}

function commentPreview(comment: string | null): string {
  const value = comment?.trim() || "No comment provided.";
  return value.length <= 120 ? value : `${value.slice(0, 117).trimEnd()}...`;
}

function normalizeBookingStatus(status: string | null): string {
  if (status === "confirmed" || status === "cancelled" || status === "completed" || status === "expired") {
    return status;
  }

  return "pending";
}

function normalizePaymentStatus(status: string | null): BookingPaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(status ?? "")
    ? status as BookingPaymentStatus
    : "pending";
}

function normalizeReviewStatus(status: string): ReviewModerationStatus {
  return status === "hidden" ? "hidden" : "published";
}

function normalizeVerificationStatus(value: string): AdminPartnerVerificationStatus {
  return (adminPartnerVerificationStatuses as readonly string[]).includes(value)
    ? value as AdminPartnerVerificationStatus
    : "pending";
}

function requireAdminRole(roles: string[]) {
  if (!roles.includes("admin")) throw new Error("FORBIDDEN");
}

function buildStatCards(metrics: AdminDashboardMetrics): AdminStatCardProps[] {
  return [
    {
      label: "Total users",
      value: formatNumber(metrics.totalUsers),
      detail: `${formatNumber(metrics.totalClients)} clients / ${formatNumber(metrics.totalPartners)} partners`,
      tone: "blue",
      href: "/admin/users",
    },
    {
      label: "Clients",
      value: formatNumber(metrics.totalClients),
      detail: "Client role accounts",
      tone: "neutral",
      href: "/admin/users?role=client",
    },
    {
      label: "Partners",
      value: formatNumber(metrics.totalPartners),
      detail: `${formatNumber(metrics.verifiedPartners)} verified / ${formatNumber(metrics.pendingPartners)} pending`,
      tone: metrics.pendingPartners ? "amber" : "blue",
      href: "/admin/partners",
    },
    {
      label: "Hotels",
      value: formatNumber(metrics.totalHotels),
      detail: `${formatNumber(metrics.totalRoomTypes)} room types`,
      tone: "blue",
      href: "/admin/hotels",
    },
    {
      label: "Room inventory",
      value: formatNumber(metrics.totalRoomInventory),
      detail: "Total rooms across all room types",
      tone: "neutral",
      href: "/admin/analytics",
    },
    {
      label: "Bookings",
      value: formatNumber(metrics.totalBookings),
      detail: `${formatNumber(metrics.confirmedBookings)} confirmed / ${formatNumber(metrics.completedBookings)} completed`,
      tone: "neutral",
      href: "/admin/bookings",
    },
    {
      label: "Pending bookings",
      value: formatNumber(metrics.pendingBookings),
      detail: `${formatNumber(metrics.cancelledBookings)} cancelled platform-wide`,
      tone: metrics.pendingBookings ? "amber" : "neutral",
      href: "/admin/bookings?status=pending",
    },
    {
      label: "Total revenue",
      value: formatCurrency(metrics.totalRevenue),
      detail: "Paid confirmed/completed stays",
      tone: "blue",
      href: "/admin/payments",
    },
    {
      label: "Revenue this month",
      value: formatCurrency(metrics.revenueThisMonth),
      detail: "Paid room nights overlapping this month",
      tone: "blue",
      href: "/admin/reports",
    },
    {
      label: "Occupancy",
      value: percent(metrics.averageOccupancyRate),
      detail: "Last 30 days average",
      tone: "amber",
      href: "/admin/analytics",
    },
    {
      label: "Reviews",
      value: formatNumber(metrics.totalReviews),
      detail: `${formatNumber(metrics.publishedReviews)} published / ${formatNumber(metrics.hiddenReviews)} hidden`,
      tone: metrics.hiddenReviews ? "amber" : "neutral",
      href: "/admin/reviews",
    },
    {
      label: "Review rating",
      value: metrics.averageReviewRating?.toFixed(2) ?? "No data",
      detail: "Average published review rating",
      tone: "neutral",
      href: "/admin/reviews",
    },
    {
      label: "Recent payments",
      value: formatNumber(metrics.recentPaymentsCount),
      detail: "Bookings with payment data in 30 days",
      tone: "blue",
      href: "/admin/payments",
    },
  ];
}

async function getMetricExtras(): Promise<MetricExtraRow> {
  const row = await executeRows<MetricExtraRow>(sql`
    select
      (select count(*)::int from room_types) as total_room_types,
      (select count(*)::int from bookings
        where coalesce(status, 'pending') in ('pending', 'pending_payment')
      ) as pending_bookings,
      (select count(*)::int from reviews where moderation_status = 'published') as published_reviews,
      (select count(*)::int from bookings
        where created_at >= now() - interval '30 days'
          and (payment_status is not null or payment_method is not null)
      ) as recent_payments_count
  `).then((rows) => rows[0]);

  return {
    total_room_types: toNumber(row?.total_room_types),
    pending_bookings: toNumber(row?.pending_bookings),
    published_reviews: toNumber(row?.published_reviews),
    recent_payments_count: toNumber(row?.recent_payments_count),
  };
}

async function getRolesForUsers(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  const rows = await db
    .select({ userId: userRoles.userId, role: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(inArray(userRoles.userId, userIds))
    .orderBy(roles.name);

  return rows.reduce((map, row) => {
    map.set(row.userId, [...(map.get(row.userId) ?? []), row.role]);
    return map;
  }, new Map<string, string[]>());
}

async function getRecentUsers(): Promise<AdminDashboardRecentUser[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: userProfiles.fullName,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(DASHBOARD_LIMIT);
  const rolesByUserId = await getRolesForUsers(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    roles: rolesByUserId.get(row.id) ?? [],
    isActive: row.isActive,
    createdAt: toIsoString(row.createdAt),
  }));
}

async function getPartnerRows(
  pendingOnly = false
): Promise<AdminDashboardPartner[]> {
  const query = db
    .select({
      id: partners.id,
      companyName: partners.companyName,
      representativeName: sql<string>`concat_ws(' ', ${partners.representativeFirstName}, ${partners.representativeLastName})`,
      email: partners.email,
      verificationStatus: partners.verificationStatus,
      isVerified: partners.isVerified,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .$dynamic();

  if (pendingOnly) query.where(eq(partners.verificationStatus, "pending"));

  const rows = await query
    .orderBy(desc(partners.createdAt), desc(partners.id))
    .limit(DASHBOARD_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    companyName: row.companyName,
    representativeName: row.representativeName,
    email: row.email,
    verificationStatus: normalizeVerificationStatus(row.verificationStatus),
    isVerified: row.isVerified,
    createdAt: toIsoString(row.createdAt),
  }));
}

async function getRecentBookings(): Promise<AdminDashboardRecentBooking[]> {
  const rows = await db
    .select({
      id: bookings.id,
      guestUserId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelName: hotels.name,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      roomTypeName: roomTypes.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(DASHBOARD_LIMIT);

  return rows.map((row) => mapRecentBooking(row as RecentBookingRow));
}

function mapRecentBooking(row: RecentBookingRow): AdminDashboardRecentBooking {
  const checkInDate = toDateString(row.checkInDate);
  const checkOutDate = toDateString(row.checkOutDate);

  return {
    id: row.id,
    guestUserId: row.guestUserId,
    guestFullName: displayName(row.guestFullName, row.guestEmail),
    hotelName: row.hotelName,
    partnerId: row.partnerId,
    partnerCompanyName: row.partnerCompanyName,
    roomTypeName: row.roomTypeName,
    checkInDate,
    checkOutDate,
    status: normalizeBookingStatus(row.status),
    paymentStatus: normalizePaymentStatus(row.paymentStatus),
    totalPrice: calculateBookingTotal({
      pricePerNight: row.pricePerNight,
      roomsCount: getBookingRoomsCount(row.roomsCount),
      checkInDate,
      checkOutDate,
    }),
    createdAt: toIsoString(row.createdAt),
  };
}

async function getRecentReviews(): Promise<AdminDashboardRecentReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      userId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelName: hotels.name,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      rating: reviews.rating,
      comment: reviews.comment,
      moderationStatus: reviews.moderationStatus,
      partnerReply: reviews.partnerReply,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(DASHBOARD_LIMIT);

  return rows.map((row) => mapRecentReview(row as RecentReviewRow));
}

function mapRecentReview(row: RecentReviewRow): AdminDashboardRecentReview {
  return {
    id: row.id,
    userId: row.userId,
    guestFullName: displayName(row.guestFullName, row.guestEmail),
    hotelName: row.hotelName,
    partnerId: row.partnerId,
    partnerCompanyName: row.partnerCompanyName,
    rating: row.rating,
    commentPreview: commentPreview(row.comment),
    moderationStatus: normalizeReviewStatus(row.moderationStatus),
    hasPartnerReply: Boolean(row.partnerReply?.trim()),
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  };
}

function buildReviewModerationSummary(
  metrics: AdminDashboardMetrics
): AdminDashboardSummaryItem[] {
  return [
    { label: "published", value: metrics.publishedReviews, tone: "blue" },
    { label: "hidden", value: metrics.hiddenReviews, tone: metrics.hiddenReviews ? "red" : "neutral" },
  ];
}

export async function getAdminDashboard(roles: string[]): Promise<AdminDashboardResult> {
  requireAdminRole(roles);

  const filters = parseAdminReportFilters(new URLSearchParams());
  const [
    reports,
    extras,
    recentUsers,
    recentPartners,
    pendingPartnerApprovals,
    recentBookings,
    recentReviews,
    system,
  ] = await Promise.all([
    getAdminReports(filters),
    getMetricExtras(),
    getRecentUsers(),
    getPartnerRows(),
    getPartnerRows(true),
    getRecentBookings(),
    getRecentReviews(),
    getAdminSystemStatus(),
  ]);
  const summary = reports.summary;
  const metrics: AdminDashboardMetrics = {
    totalUsers: summary.totalUsers,
    totalClients: summary.totalClients,
    totalPartners: summary.totalPartners,
    pendingPartners: summary.pendingPartners,
    verifiedPartners: summary.verifiedPartners,
    totalHotels: summary.totalHotels,
    totalRoomTypes: extras.total_room_types,
    totalRoomInventory: summary.totalRoomInventory,
    totalBookings: summary.totalBookings,
    pendingBookings: extras.pending_bookings,
    confirmedBookings: summary.confirmedBookings,
    cancelledBookings: summary.cancelledBookings,
    completedBookings: summary.completedBookings,
    totalRevenue: summary.totalRevenue,
    revenueThisMonth: summary.revenueThisMonth,
    averageOccupancyRate: reports.occupancySummary.averageRate,
    averageReviewRating: summary.averageReviewRating,
    totalReviews: summary.totalReviews,
    hiddenReviews: summary.hiddenReviews,
    publishedReviews: extras.published_reviews,
    recentPaymentsCount: extras.recent_payments_count,
  };

  return {
    generatedAt: new Date().toISOString(),
    rangeLabel: `${filters.dateFrom} to ${filters.dateTo}`,
    metrics,
    statCards: buildStatCards(metrics),
    recentUsers,
    recentPartners,
    pendingPartnerApprovals,
    recentBookings,
    recentReviews,
    revenueTrend: reports.revenueOverTime,
    bookingStatusSummary: reports.bookingStatusDistribution,
    reviewModerationSummary: buildReviewModerationSummary(metrics),
    systemHealth: system.checks,
  };
}
