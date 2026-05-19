import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import { bookings, hotels, partners, reviews, roles, roomTypes, userProfiles, userRoles } from "@/db/schema";
import type {
  CreateReviewRequest,
  HotelReview,
  HotelReviewSummary,
  HotelReviewsPageData,
  MyReviewsPage,
  MyReview,
  PaginatedHotelReviews,
  PartnerReviewReply,
  Review,
  ReviewModerationStatus,
} from "@repo/types";

const MAX_COMMENT_LENGTH = 2000;
const DEFAULT_REVIEW_PAGE_LIMIT = 3;
const SHINING_STAR_TOOLTIP = "This property is newly registered and building guest trust.";
const NEW_HOTEL_DAYS = 90;
const EXCELLENT_REVIEW_THRESHOLD = 10;
const DEBUG_REVIEW_BADGES = process.env.REVIEWS_DEBUG_BADGE === "true";

const reviewerProfiles = alias(userProfiles, "reviewer_profiles");
const replyAuthorProfiles = alias(userProfiles, "reply_author_profiles");

const HOTEL_REVIEW_FIELDS = {
  id: reviews.id,
  userId: reviews.userId,
  hotelId: reviews.hotelId,
  bookingId: reviews.bookingId,
  rating: reviews.rating,
  comment: reviews.comment,
  moderationStatus: reviews.moderationStatus,
  partnerReply: reviews.partnerReply,
  partnerRepliedAt: reviews.partnerRepliedAt,
  partnerRepliedBy: reviews.partnerRepliedBy,
  hotelPartnerUserId: partners.userId,
  partnerRepliedByName: replyAuthorProfiles.fullName,
  createdAt: reviews.createdAt,
  userName: reviewerProfiles.fullName,
  userAvatarKey: reviewerProfiles.avatarKey,
};

const MY_REVIEW_FIELDS = {
  ...HOTEL_REVIEW_FIELDS,
  hotelName: hotels.name,
  hotelLocation: hotels.location,
};

interface ReviewableBookingRow {
  id: number;
  userId: string;
  hotelId: number;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  checkOutDate: string;
}

interface ReviewRow {
  id: number;
  userId: string;
  hotelId: number;
  bookingId: number;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  partnerReply: string | null;
  partnerRepliedAt: Date | string | null;
  partnerRepliedBy: string | null;
  hotelPartnerUserId?: string | null;
  partnerRepliedByName?: string | null;
  createdAt: Date | string;
}

interface HotelReviewRow extends ReviewRow {
  userName: string | null;
  userAvatarKey: string | null;
}

interface MyReviewRow extends HotelReviewRow {
  hotelName: string;
  hotelLocation: string;
}

interface ReviewPaginationInput {
  limit?: number;
  offset?: number;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isCompletedBooking(row: ReviewableBookingRow): boolean {
  const isConfirmed = row.status === "confirmed" || row.status === "completed";
  const checkoutHasPassed = parseDateOnly(row.checkOutDate) < parseDateOnly(formatDate(new Date()));
  const isPaidStripe = row.paymentMethod === "stripe" && row.paymentStatus === "paid";
  const isCashOnArrival = row.paymentMethod === "cash_on_arrival" && row.paymentStatus === "pending";

  return isConfirmed && checkoutHasPassed && (isPaidStripe || isCashOnArrival);
}

function normalizeComment(comment: unknown): string | null {
  if (comment === undefined || comment === null) return null;
  if (typeof comment !== "string") throw new Error("INVALID_COMMENT");

  const trimmed = comment.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_COMMENT_LENGTH) throw new Error("INVALID_COMMENT");

  return trimmed;
}

function validateCreateReviewInput(input: CreateReviewRequest): string | null {
  if (!Number.isInteger(input.bookingId) || input.bookingId < 1) {
    throw new Error("INVALID_BOOKING_ID");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("INVALID_RATING");
  }

  return normalizeComment(input.comment);
}

function validateHotelId(hotelId: number): void {
  if (!Number.isInteger(hotelId) || hotelId < 1) {
    throw new Error("INVALID_HOTEL_ID");
  }
}

function normalizePagination(input: ReviewPaginationInput) {
  const limit = input.limit ?? DEFAULT_REVIEW_PAGE_LIMIT;
  const offset = input.offset ?? 0;

  return {
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 24) : DEFAULT_REVIEW_PAGE_LIMIT,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
  };
}

function getAvatarUrl(avatarKey: string | null): string | null {
  if (!avatarKey) return null;
  if (/^https?:\/\//.test(avatarKey)) return avatarKey;

  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;
  return publicBaseUrl ? `${publicBaseUrl.replace(/\/+$/, "")}/${avatarKey}` : null;
}

function mapPartnerReply(row: ReviewRow): PartnerReviewReply | null {
  if (!row.partnerReply || !row.partnerRepliedAt || !row.partnerRepliedBy) return null;
  if (row.hotelPartnerUserId && row.partnerRepliedBy !== row.hotelPartnerUserId) return null;

  return {
    comment: row.partnerReply,
    repliedAt: toIsoString(row.partnerRepliedAt),
    repliedByName: row.partnerRepliedByName ?? null,
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.userId,
    hotelId: row.hotelId,
    bookingId: row.bookingId,
    rating: row.rating,
    comment: row.comment,
    moderationStatus: row.moderationStatus as ReviewModerationStatus,
    partnerReply: mapPartnerReply(row),
    createdAt: toIsoString(row.createdAt),
  };
}

function mapHotelReview(row: HotelReviewRow): HotelReview {
  return {
    ...mapReview(row),
    userName: row.userName,
    userAvatarUrl: getAvatarUrl(row.userAvatarKey),
  };
}

function mapMyReview(row: MyReviewRow): MyReview {
  return {
    ...mapHotelReview(row),
    hotelName: row.hotelName,
    hotelLocation: row.hotelLocation,
  };
}

function isUniqueBookingReviewError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("reviews_booking_id_unique");
}

function coerceAverageRating(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return null;

  return Math.round(numericValue * 10) / 10;
}

function buildReviewLabel(reviewCount: number): string {
  if (reviewCount === 0) return "No reviews yet";
  return `${reviewCount} review${reviewCount === 1 ? "" : "s"}`;
}

function isRegisteredWithinDays(registeredAt: Date | string, days: number): boolean {
  const registeredDate = registeredAt instanceof Date ? registeredAt : new Date(registeredAt);
  const ageMs = Date.now() - registeredDate.getTime();
  const maxAgeMs = days * 24 * 60 * 60 * 1000;

  return ageMs <= maxAgeMs;
}

function getHotelAgeDays(registeredAt: Date | string): number {
  const registeredDate = registeredAt instanceof Date ? registeredAt : new Date(registeredAt);
  const ageMs = Date.now() - registeredDate.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.floor(ageMs / msPerDay);
}

function logReviewBadgeDebug(input: {
  hotelId: number;
  registeredAt: Date | string;
  reviewCount: number;
  excellentReviewCount: number;
  isRecentlyRegistered: boolean;
  isShiningStar: boolean;
  averageRating: number | null;
}) {
  if (!DEBUG_REVIEW_BADGES) return;

  const registeredDate = input.registeredAt instanceof Date
    ? input.registeredAt
    : new Date(input.registeredAt);

  console.info("[reviews:badge]", {
    hotelId: input.hotelId,
    registeredAt: registeredDate.toISOString(),
    hotelAgeDays: getHotelAgeDays(input.registeredAt),
    reviewCount: input.reviewCount,
    excellentReviewCount: input.excellentReviewCount,
    excellentReviewThreshold: EXCELLENT_REVIEW_THRESHOLD,
    isRecentlyRegistered: input.isRecentlyRegistered,
    isShiningStar: input.isShiningStar,
    averageRating: input.averageRating,
  });
}

function buildReviewSummary(
  hotelId: number,
  registeredAt: Date | string,
  averageRating: unknown,
  reviewCountValue: unknown,
  excellentReviewCountValue: unknown
): HotelReviewSummary {
  const reviewCount = Number(reviewCountValue ?? 0);
  const excellentReviewCount = Number(excellentReviewCountValue ?? 0);
  const rating = coerceAverageRating(averageRating);
  const isRecentlyRegistered = isRegisteredWithinDays(registeredAt, NEW_HOTEL_DAYS);
  const isShiningStar = isRecentlyRegistered || excellentReviewCount < EXCELLENT_REVIEW_THRESHOLD;

  logReviewBadgeDebug({
    hotelId,
    registeredAt,
    reviewCount,
    excellentReviewCount,
    isRecentlyRegistered,
    isShiningStar,
    averageRating: rating,
  });

  return {
    averageRating: rating,
    reviewCount,
    excellentReviewCount,
    ratingLabel: rating === null ? "New" : rating.toFixed(1),
    reviewLabel: buildReviewLabel(reviewCount),
    trustBadge: isShiningStar
      ? { kind: "shining_star", label: "Shining Star", tooltip: SHINING_STAR_TOOLTIP }
      : null,
  };
}

async function assertClientUser(userId: string): Promise<void> {
  const role = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(userRoles.userId, userId), eq(roles.name, "client")))
    .then((rows) => rows[0]);

  if (!role) {
    throw new Error("CLIENT_ROLE_REQUIRED");
  }
}

async function getReviewableBooking(bookingId: number): Promise<ReviewableBookingRow | null> {
  const row = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      hotelId: hotels.id,
      status: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
      checkOutDate: bookings.checkOutDate,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(eq(bookings.id, bookingId))
    .then((rows) => rows[0]);

  return row ?? null;
}

async function assertReviewDoesNotExist(bookingId: number): Promise<void> {
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .then((rows) => rows[0]);

  if (existing) {
    throw new Error("REVIEW_ALREADY_EXISTS");
  }
}

export async function createReview(input: CreateReviewRequest & { userId: string }): Promise<Review> {
  await assertClientUser(input.userId);
  const comment = validateCreateReviewInput(input);
  const booking = await getReviewableBooking(input.bookingId);

  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.userId !== input.userId) throw new Error("FORBIDDEN_BOOKING_ACCESS");
  if (!isCompletedBooking(booking)) throw new Error("BOOKING_NOT_COMPLETED");

  await assertReviewDoesNotExist(input.bookingId);

  try {
    const inserted = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        hotelId: booking.hotelId,
        bookingId: input.bookingId,
        rating: input.rating,
        comment,
      })
      .returning();

    return mapReview(inserted[0]);
  } catch (error) {
    if (isUniqueBookingReviewError(error)) throw new Error("REVIEW_ALREADY_EXISTS");
    throw error;
  }
}

export async function getHotelReviewSummariesByHotelIds(
  hotelIds: number[]
): Promise<Map<number, HotelReviewSummary>> {
  if (hotelIds.length === 0) return new Map();

  const rows = await db
    .select({
      hotelId: hotels.id,
      registeredAt: hotels.registeredAt,
      averageRating: sql<string | null>`avg(${reviews.rating})`,
      reviewCount: sql<string>`count(${reviews.id})`,
      excellentReviewCount: sql<string>`
        coalesce(sum(case when ${reviews.rating} >= 4 then 1 else 0 end), 0)
      `,
    })
    .from(hotels)
    .leftJoin(reviews, and(eq(reviews.hotelId, hotels.id), eq(reviews.moderationStatus, "published")))
    .where(inArray(hotels.id, hotelIds))
    .groupBy(hotels.id, hotels.registeredAt);

  return new Map(rows.map((row) => [
    row.hotelId,
    buildReviewSummary(row.hotelId, row.registeredAt, row.averageRating, row.reviewCount, row.excellentReviewCount),
  ]));
}

export async function getHotelReviewsPage(
  hotelId: number,
  input: ReviewPaginationInput = {}
): Promise<PaginatedHotelReviews> {
  validateHotelId(hotelId);
  const { limit, offset } = normalizePagination(input);

  const rows = await db
    .select(HOTEL_REVIEW_FIELDS)
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, reviews.userId))
    .leftJoin(replyAuthorProfiles, eq(replyAuthorProfiles.userId, reviews.partnerRepliedBy))
    .where(and(eq(reviews.hotelId, hotelId), eq(reviews.moderationStatus, "published")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);

  return {
    reviews: pageRows.map(mapHotelReview),
    pagination: {
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
      hasMore,
    },
  };
}

export async function getHotelReviews(hotelId: number): Promise<HotelReview[]> {
  validateHotelId(hotelId);

  const rows = await db
    .select(HOTEL_REVIEW_FIELDS)
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, reviews.userId))
    .leftJoin(replyAuthorProfiles, eq(replyAuthorProfiles.userId, reviews.partnerRepliedBy))
    .where(and(eq(reviews.hotelId, hotelId), eq(reviews.moderationStatus, "published")))
    .orderBy(desc(reviews.createdAt));

  return rows.map(mapHotelReview);
}

export async function getHotelReviewsPageData(
  hotelId: number,
  input: ReviewPaginationInput = {}
): Promise<HotelReviewsPageData | null> {
  validateHotelId(hotelId);

  const hotel = await db
    .select({ id: hotels.id, name: hotels.name, location: hotels.location })
    .from(hotels)
    .where(eq(hotels.id, hotelId))
    .then((rows) => rows[0]);

  if (!hotel) return null;

  const [summaryMap, paginatedReviews] = await Promise.all([
    getHotelReviewSummariesByHotelIds([hotelId]),
    getHotelReviewsPage(hotelId, input),
  ]);

  return {
    hotel,
    summary: summaryMap.get(hotelId) ?? buildReviewSummary(hotelId, new Date(), null, 0, 0),
    ...paginatedReviews,
  };
}

export async function getMyReviews(userId: string): Promise<MyReview[]> {
  await assertClientUser(userId);

  const rows = await db
    .select(MY_REVIEW_FIELDS)
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, reviews.userId))
    .leftJoin(replyAuthorProfiles, eq(replyAuthorProfiles.userId, reviews.partnerRepliedBy))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));

  return rows.map(mapMyReview);
}

export async function getMyReviewsPage(
  userId: string,
  input: { page?: number; pageSize?: number } = {}
): Promise<MyReviewsPage> {
  await assertClientUser(userId);

  const requestedPage = Number.isInteger(input.page) && (input.page as number) > 0 ? (input.page as number) : 1;
  const pageSize = Number.isInteger(input.pageSize) && (input.pageSize as number) > 0
    ? Math.min(input.pageSize as number, 24)
    : 10;

  const total = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .then((result) => Number(result[0]?.total ?? 0));

  const totalItems = Number(total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, requestedPage), totalPages);
  const rows = await db
    .select(MY_REVIEW_FIELDS)
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(partners, eq(partners.id, hotels.partnerId))
    .leftJoin(reviewerProfiles, eq(reviewerProfiles.userId, reviews.userId))
    .leftJoin(replyAuthorProfiles, eq(replyAuthorProfiles.userId, reviews.partnerRepliedBy))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    reviews: rows.map(mapMyReview),
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export async function getMyReviewsCount(userId: string): Promise<number> {
  await assertClientUser(userId);

  const row = await db
    .select({ reviewCount: sql<string>`count(${reviews.id})` })
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .then((rows) => rows[0]);

  return Number(row?.reviewCount ?? 0);
}
