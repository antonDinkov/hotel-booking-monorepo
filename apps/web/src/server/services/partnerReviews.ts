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
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  bookings,
  hotelImages,
  hotels,
  reviews,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { parseDateOnly } from "@/lib/date-only";
import { resolveImageUrl } from "@/lib/image-urls";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type {
  PartnerReviewDetails,
  PartnerReviewFilters,
  PartnerReviewHotelOption,
  PartnerReviewListItem,
  PartnerReviewListResult,
  PartnerReviewReplyStatus,
  PartnerReviewRow,
  PartnerReviewSort,
} from "@/types/partner-review";
import type { ReviewModerationStatus } from "@/types/review";

const reviewerProfiles = alias(userProfiles, "partner_review_reviewer_profiles");
const replyAuthorProfiles = alias(userProfiles, "partner_review_reply_author_profiles");

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeGuestName(fullName: string | null, email: string): string {
  const name = fullName?.trim();
  return name || email.split("@")[0] || "Guest";
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function replyStatus(reply: string | null): PartnerReviewReplyStatus {
  return reply?.trim() ? "replied" : "not_replied";
}

function normalizeBookingStatus(status: string | null): string {
  if (status === "pending_payment") return "pending";
  return status ?? "pending";
}

function normalizeReplyText(value: string): string {
  const reply = value.trim();
  if (!reply || reply.length > 2000) throw new Error("VALIDATION_ERROR");
  return reply;
}

function mapReview(row: PartnerReviewRow): PartnerReviewListItem {
  return {
    id: row.id,
    userId: row.userId,
    guestFullName: normalizeGuestName(row.guestFullName, row.userEmail),
    guestEmail: row.userEmail,
    guestPhone: row.guestPhone,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    hotelLocation: row.hotelLocation,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    bookingId: row.bookingId,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    bookingStatus: normalizeBookingStatus(row.bookingStatus),
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    rating: row.rating,
    comment: row.comment,
    moderationStatus: row.moderationStatus as ReviewModerationStatus,
    partnerReply: row.partnerReply,
    partnerReplyStatus: replyStatus(row.partnerReply),
    partnerRepliedAt: toIsoString(row.partnerRepliedAt),
    partnerRepliedBy: row.partnerRepliedBy,
    partnerRepliedByName: row.partnerRepliedByName,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  };
}

function getSortOrder(sort: PartnerReviewSort): SQL[] {
  if (sort === "oldest") return [asc(reviews.createdAt), asc(reviews.id)];
  if (sort === "highest_rating") return [desc(reviews.rating), desc(reviews.createdAt)];
  if (sort === "lowest_rating") return [asc(reviews.rating), desc(reviews.createdAt)];
  return [desc(reviews.createdAt), desc(reviews.id)];
}

function buildReviewConditions(
  partnerId: string,
  filters: PartnerReviewFilters
): SQL[] {
  const conditions: SQL[] = [
    eq(hotels.partnerId, partnerId),
    eq(roomTypes.hotelId, hotels.id),
  ];

  if (filters.hotelId) conditions.push(eq(hotels.id, filters.hotelId));
  if (filters.rating) conditions.push(eq(reviews.rating, filters.rating));
  if (filters.moderationStatus) conditions.push(eq(reviews.moderationStatus, filters.moderationStatus));
  if (filters.replyStatus === "replied") conditions.push(sql`${reviews.partnerReply} is not null and length(trim(${reviews.partnerReply})) > 0`);
  if (filters.replyStatus === "not_replied") conditions.push(sql`${reviews.partnerReply} is null or length(trim(${reviews.partnerReply})) = 0`);
  if (filters.dateFrom) conditions.push(gte(reviews.createdAt, parseDateOnly(filters.dateFrom)));
  if (filters.dateTo) conditions.push(lt(reviews.createdAt, addDays(parseDateOnly(filters.dateTo), 1)));

  return conditions;
}

function selectPartnerReviewRows() {
  return db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      userEmail: users.email,
      guestFullName: reviewerProfiles.fullName,
      guestPhone: reviewerProfiles.phone,
      hotelId: hotels.id,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      bookingId: bookings.id,
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
      partnerRepliedBy: reviews.partnerRepliedBy,
      partnerRepliedByName: replyAuthorProfiles.fullName,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, reviews.userId))
    .leftJoin(replyAuthorProfiles, eq(replyAuthorProfiles.userId, reviews.partnerRepliedBy));
}

async function getHotelOptions(partnerId: string): Promise<PartnerReviewHotelOption[]> {
  return db
    .select({ id: hotels.id, name: hotels.name })
    .from(hotels)
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(asc(hotels.name));
}

async function countPartnerReviews(conditions: SQL[]): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .where(and(...conditions))
    .then((rows) => rows[0]);

  return Number(row?.value ?? 0);
}

async function getReviewImage(hotelId: number, roomTypeId: number): Promise<string | null> {
  const row = await db
    .select({ roomTypeId: hotelImages.roomTypeId, imageKey: hotelImages.imageKey })
    .from(hotelImages)
    .where(
      and(
        eq(hotelImages.hotelId, hotelId),
        sql`${hotelImages.roomTypeId} is null or ${hotelImages.roomTypeId} = ${roomTypeId}`
      )
    )
    .orderBy(desc(hotelImages.isCover), asc(hotelImages.sortOrder), asc(hotelImages.id))
    .then((rows) => rows.find((item) => item.roomTypeId === roomTypeId) ?? rows[0]);

  return row?.imageKey ? resolveImageUrl(row.imageKey) : null;
}

async function getPartnerReviewRow(
  partnerId: string,
  reviewId: number
): Promise<PartnerReviewRow | null> {
  const row = await selectPartnerReviewRows()
    .where(and(eq(reviews.id, reviewId), eq(hotels.partnerId, partnerId), eq(roomTypes.hotelId, hotels.id)))
    .then((rows) => rows[0]);

  return row ?? null;
}

export async function listPartnerReviews(
  userId: string,
  filters: PartnerReviewFilters
): Promise<PartnerReviewListResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const conditions = buildReviewConditions(partnerId, filters);
  const [hotelOptions, totalItems] = await Promise.all([
    getHotelOptions(partnerId),
    countPartnerReviews(conditions),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);

  const rows = await selectPartnerReviewRows()
    .where(and(...conditions))
    .orderBy(...getSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return {
    reviews: rows.map(mapReview),
    hotels: hotelOptions,
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
  };
}

export async function getPartnerReviewDetails(
  userId: string,
  reviewId: number
): Promise<PartnerReviewDetails | null> {
  const partnerId = await getPartnerIdForUser(userId);
  const row = await getPartnerReviewRow(partnerId, reviewId);
  if (!row) return null;

  return {
    ...mapReview(row),
    imageUrl: await getReviewImage(row.hotelId, row.roomTypeId),
  };
}

export async function replyToPartnerReview(
  userId: string,
  reviewId: number,
  reply: string
): Promise<PartnerReviewDetails> {
  const partnerId = await getPartnerIdForUser(userId);
  const row = await getPartnerReviewRow(partnerId, reviewId);
  if (!row) throw new Error("REVIEW_NOT_FOUND");

  await db
    .update(reviews)
    .set({
      partnerReply: normalizeReplyText(reply),
      partnerRepliedAt: new Date(),
      partnerRepliedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId));

  const updated = await getPartnerReviewDetails(userId, reviewId);
  if (!updated) throw new Error("REVIEW_NOT_FOUND");
  return updated;
}
