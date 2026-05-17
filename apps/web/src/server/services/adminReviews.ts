import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  lt,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  bookings,
  hotels,
  partners,
  reviews,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import type {
  AdminReviewCounts,
  AdminReviewDetails,
  AdminReviewFilters,
  AdminReviewListItem,
  AdminReviewListResult,
  AdminReviewOption,
  AdminReviewUpdateInput,
} from "@/types/admin-reviews";
import type { ReviewModerationStatus } from "@/types/review";

type AdminReviewRow = {
  id: number;
  userId: string;
  guestEmail: string;
  guestFullName: string | null;
  guestPhone: string | null;
  hotelId: number;
  hotelName: string;
  hotelLocation: string;
  partnerId: string;
  partnerCompanyName: string;
  bookingId: number;
  roomTypeId: number;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  partnerReply: string | null;
  partnerRepliedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
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

function displayName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || "Guest";
}

function normalizeModerationStatus(status: string): ReviewModerationStatus {
  return status === "hidden" ? "hidden" : "published";
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildReviewConditions(filters: AdminReviewFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.partnerId) conditions.push(eq(partners.id, filters.partnerId));
  if (filters.rating) conditions.push(eq(reviews.rating, filters.rating));
  if (filters.moderationStatus) {
    conditions.push(eq(reviews.moderationStatus, filters.moderationStatus));
  }
  if (filters.replyStatus === "replied") {
    conditions.push(sql`${reviews.partnerReply} is not null and length(trim(${reviews.partnerReply})) > 0`);
  }
  if (filters.replyStatus === "not_replied") {
    conditions.push(sql`${reviews.partnerReply} is null or length(trim(${reviews.partnerReply})) = 0`);
  }
  if (filters.dateFrom) conditions.push(gte(reviews.createdAt, parseDateOnly(filters.dateFrom)));
  if (filters.dateTo) conditions.push(lt(reviews.createdAt, addDays(parseDateOnly(filters.dateTo), 1)));

  return conditions;
}

function getSortOrder(sort: AdminReviewFilters["sort"]): SQL[] {
  if (sort === "oldest") return [asc(reviews.createdAt), asc(reviews.id)];
  if (sort === "highest_rating") return [desc(reviews.rating), desc(reviews.createdAt)];
  if (sort === "lowest_rating") return [asc(reviews.rating), desc(reviews.createdAt)];
  return [desc(reviews.createdAt), desc(reviews.id)];
}

function selectAdminReviewRows() {
  return db
    .select({
      id: reviews.id,
      userId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      guestPhone: userProfiles.phone,
      hotelId: hotels.id,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      bookingId: bookings.id,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      bookingStatus: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
      rating: reviews.rating,
      comment: reviews.comment,
      moderationStatus: reviews.moderationStatus,
      partnerReply: reviews.partnerReply,
      partnerRepliedAt: reviews.partnerRepliedAt,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id));
}

function mapReview(row: AdminReviewRow): AdminReviewListItem {
  return {
    id: row.id,
    userId: row.userId,
    guestFullName: displayName(row.guestFullName, row.guestEmail),
    guestEmail: row.guestEmail,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    partnerId: row.partnerId,
    partnerCompanyName: row.partnerCompanyName,
    bookingId: row.bookingId,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    rating: row.rating,
    comment: row.comment,
    moderationStatus: normalizeModerationStatus(row.moderationStatus),
    partnerReply: row.partnerReply,
    partnerRepliedAt: toIsoString(row.partnerRepliedAt),
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
  };
}

function mapDetails(row: AdminReviewRow): AdminReviewDetails {
  return {
    ...mapReview(row),
    checkInDate: toDateString(row.checkInDate),
    checkOutDate: toDateString(row.checkOutDate),
    bookingStatus: row.bookingStatus,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    hotelLocation: row.hotelLocation,
    guestPhone: row.guestPhone,
  };
}

async function countFilteredReviews(filters: AdminReviewFilters): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .where(and(...buildReviewConditions(filters)))
    .then((rows) => rows[0]);

  return toNumber(row?.value);
}

async function getReviewCounts(): Promise<AdminReviewCounts> {
  const row = await db.execute<{
    total: number;
    published: number;
    hidden: number;
    replied: number;
    not_replied: number;
  }>(sql`
    select
      count(*)::int as total,
      count(*) filter (where moderation_status = 'published')::int as published,
      count(*) filter (where moderation_status = 'hidden')::int as hidden,
      count(*) filter (where partner_reply is not null and length(trim(partner_reply)) > 0)::int as replied,
      count(*) filter (where partner_reply is null or length(trim(partner_reply)) = 0)::int as not_replied
    from reviews
  `).then((result) => result.rows[0]);

  return {
    total: toNumber(row?.total),
    published: toNumber(row?.published),
    hidden: toNumber(row?.hidden),
    replied: toNumber(row?.replied),
    notReplied: toNumber(row?.not_replied),
  };
}

async function getHotelOptions(): Promise<AdminReviewOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .orderBy(asc(hotels.name));
}

async function getPartnerOptions(): Promise<AdminReviewOption[]> {
  return db
    .select({ id: partners.id, name: partners.companyName })
    .from(partners)
    .orderBy(asc(partners.companyName));
}

export async function listAdminReviews(
  filters: AdminReviewFilters
): Promise<AdminReviewListResult> {
  const [totalItems, counts, hotels, partnerOptions] = await Promise.all([
    countFilteredReviews(filters),
    getReviewCounts(),
    getHotelOptions(),
    getPartnerOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const rows = await selectAdminReviewRows()
    .where(and(...buildReviewConditions(filters)))
    .orderBy(...getSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return {
    reviews: rows.map((row) => mapReview(row as AdminReviewRow)),
    hotels,
    partners: partnerOptions,
    counts,
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
  };
}

export async function getAdminReviewDetails(
  reviewId: number
): Promise<AdminReviewDetails | null> {
  const row = await selectAdminReviewRows()
    .where(eq(reviews.id, reviewId))
    .then((rows) => rows[0] ?? null);

  return row ? mapDetails(row as AdminReviewRow) : null;
}

export async function updateAdminReviewModeration(
  reviewId: number,
  input: AdminReviewUpdateInput
): Promise<AdminReviewDetails> {
  const updated = await db
    .update(reviews)
    .set({ moderationStatus: input.moderationStatus, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning({ id: reviews.id });

  if (!updated.length) throw new Error("REVIEW_NOT_FOUND");

  const review = await getAdminReviewDetails(reviewId);
  if (!review) throw new Error("REVIEW_NOT_FOUND");
  return review;
}
