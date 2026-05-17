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
  reviews,
  roomTypes,
  userProfiles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import {
  adminPartnerVerificationStatuses,
} from "@/lib/admin-partner-validation";
import type {
  AdminPartnerBookingSummary,
  AdminPartnerDetails,
  AdminPartnerFilterCounts,
  AdminPartnerHotelSummary,
  AdminPartnerListFilters,
  AdminPartnerListItem,
  AdminPartnerReviewSummary,
  AdminPartnerUpdateInput,
  AdminPartnerVerificationStatus,
} from "@/types/admin-partners";

const DETAIL_LIMIT = 8;

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

function commentPreview(comment: string | null): string {
  const value = comment?.trim() || "No comment provided.";
  return value.length <= 120 ? value : `${value.slice(0, 117).trimEnd()}...`;
}

function scopedSubqueryValue(alias: string) {
  return sql.raw(`"${alias}"."value"`);
}

function displayName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || email;
}

function toVerificationStatus(value: string): AdminPartnerVerificationStatus {
  return (adminPartnerVerificationStatuses as readonly string[]).includes(value)
    ? value as AdminPartnerVerificationStatus
    : "pending";
}

function buildPartnerConditions(filters: AdminPartnerListFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.verificationStatus) {
    conditions.push(eq(partners.verificationStatus, filters.verificationStatus));
  }
  if (filters.verified === "verified") conditions.push(eq(partners.isVerified, true));
  if (filters.verified === "unverified") conditions.push(eq(partners.isVerified, false));
  if (filters.createdFrom) conditions.push(gte(partners.createdAt, parseDateOnly(filters.createdFrom)));
  if (filters.createdTo) conditions.push(lte(partners.createdAt, addEndOfDay(filters.createdTo)));
  if (filters.search) conditions.push(getPartnerSearchCondition(filters.search));

  return conditions;
}

function getPartnerSearchCondition(search: string): SQL {
  const pattern = `%${search}%`;
  return or(
    ilike(partners.companyName, pattern),
    ilike(partners.email, pattern),
    ilike(partners.representativeFirstName, pattern),
    ilike(partners.representativeLastName, pattern),
    sql`concat_ws(' ', ${partners.representativeFirstName}, ${partners.representativeLastName}) ilike ${pattern}`
  ) as SQL;
}

function getPartnerSortOrder(sort: AdminPartnerListFilters["sort"]): SQL[] {
  if (sort === "oldest") return [asc(partners.createdAt), asc(partners.companyName)];
  if (sort === "company") return [asc(partners.companyName), asc(partners.createdAt)];
  if (sort === "verification") {
    return [asc(partners.verificationStatus), asc(partners.companyName)];
  }

  return [desc(partners.createdAt), desc(partners.id)];
}

function hotelCountSubquery(alias = "admin_partner_hotel_counts") {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${hotels.id})::int`.as("value"),
    })
    .from(hotels)
    .groupBy(hotels.partnerId)
    .as(alias);
}

function bookingCountSubquery(alias = "admin_partner_booking_counts") {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${bookings.id})::int`.as("value"),
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .groupBy(hotels.partnerId)
    .as(alias);
}

function reviewCountSubquery(alias = "admin_partner_review_counts") {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${reviews.id})::int`.as("value"),
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .groupBy(hotels.partnerId)
    .as(alias);
}

function mapPartnerListRow(row: AdminPartnerListItem): AdminPartnerListItem {
  return {
    ...row,
    verificationStatus: toVerificationStatus(row.verificationStatus),
    createdAt: toIsoString(row.createdAt),
    hotelsCount: toNumber(row.hotelsCount),
    bookingsCount: toNumber(row.bookingsCount),
    reviewsCount: toNumber(row.reviewsCount),
  };
}

async function countFilteredPartners(filters: AdminPartnerListFilters): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(distinct ${partners.id})::int` })
    .from(partners)
    .where(and(...buildPartnerConditions(filters)))
    .then((rows) => rows[0]);

  return toNumber(row?.value);
}

async function getPartnerFilterCounts(): Promise<AdminPartnerFilterCounts> {
  const [statusRows, verifiedRows] = await Promise.all([
    db
      .select({ status: partners.verificationStatus, value: sql<number>`count(*)::int` })
      .from(partners)
      .groupBy(partners.verificationStatus),
    db
      .select({ isVerified: partners.isVerified, value: sql<number>`count(*)::int` })
      .from(partners)
      .groupBy(partners.isVerified),
  ]);

  const statusCount = (status: AdminPartnerVerificationStatus) =>
    toNumber(statusRows.find((row) => row.status === status)?.value);
  const verifiedProfiles = toNumber(verifiedRows.find((row) => row.isVerified)?.value);
  const unverifiedProfiles = toNumber(verifiedRows.find((row) => !row.isVerified)?.value);

  return {
    total: verifiedProfiles + unverifiedProfiles,
    pending: statusCount("pending"),
    verified: statusCount("verified"),
    rejected: statusCount("rejected"),
    suspended: statusCount("suspended"),
    verifiedProfiles,
    unverifiedProfiles,
  };
}

async function getPartnerRows(
  filters: AdminPartnerListFilters,
  page: number
): Promise<AdminPartnerListItem[]> {
  const hotelCounts = hotelCountSubquery();
  const bookingCounts = bookingCountSubquery();
  const reviewCounts = reviewCountSubquery();

  const rows = await db
    .select({
      id: partners.id,
      userId: partners.userId,
      companyName: partners.companyName,
      representativeName: sql<string>`concat_ws(' ', ${partners.representativeFirstName}, ${partners.representativeLastName})`.as("representativeName"),
      email: partners.email,
      phone: partners.phone,
      website: partners.website,
      verificationStatus: partners.verificationStatus,
      isVerified: partners.isVerified,
      createdAt: sql<string | null>`${partners.createdAt}`.as("createdAt"),
      hotelsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_hotel_counts")}, 0)::int`.as("hotelsCount"),
      bookingsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_booking_counts")}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_review_counts")}, 0)::int`.as("reviewsCount"),
    })
    .from(partners)
    .leftJoin(hotelCounts, eq(hotelCounts.partnerId, partners.id))
    .leftJoin(bookingCounts, eq(bookingCounts.partnerId, partners.id))
    .leftJoin(reviewCounts, eq(reviewCounts.partnerId, partners.id))
    .where(and(...buildPartnerConditions(filters)))
    .orderBy(...getPartnerSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);

  return rows.map((row) => mapPartnerListRow(row as AdminPartnerListItem));
}

export async function listAdminPartners(
  filters: AdminPartnerListFilters
): Promise<import("@/types/admin-partners").AdminPartnerListResult> {
  const [totalItems, counts] = await Promise.all([
    countFilteredPartners(filters),
    getPartnerFilterCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const partners = await getPartnerRows(filters, page);

  return {
    partners,
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
    counts,
  };
}

async function getPartnerBase(partnerId: string) {
  const hotelCounts = hotelCountSubquery("admin_partner_detail_hotel_counts");
  const bookingCounts = bookingCountSubquery("admin_partner_detail_booking_counts");
  const reviewCounts = reviewCountSubquery("admin_partner_detail_review_counts");

  return db
    .select({
      id: partners.id,
      userId: partners.userId,
      companyName: partners.companyName,
      representativeFirstName: partners.representativeFirstName,
      representativeLastName: partners.representativeLastName,
      position: partners.position,
      email: partners.email,
      phone: partners.phone,
      website: partners.website,
      companyAddress: partners.companyAddress,
      vatNumber: partners.vatNumber,
      verificationStatus: partners.verificationStatus,
      isVerified: partners.isVerified,
      createdAt: sql<string | null>`${partners.createdAt}`.as("createdAt"),
      updatedAt: sql<string | null>`${partners.updatedAt}`.as("updatedAt"),
      hotelsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_detail_hotel_counts")}, 0)::int`.as("hotelsCount"),
      bookingsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_detail_booking_counts")}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_detail_review_counts")}, 0)::int`.as("reviewsCount"),
    })
    .from(partners)
    .leftJoin(hotelCounts, eq(hotelCounts.partnerId, partners.id))
    .leftJoin(bookingCounts, eq(bookingCounts.partnerId, partners.id))
    .leftJoin(reviewCounts, eq(reviewCounts.partnerId, partners.id))
    .where(eq(partners.id, partnerId))
    .then((rows) => rows[0] ?? null);
}

async function getLinkedUser(userId: string) {
  return db
    .select({
      id: users.id,
      email: users.email,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      isActive: users.isActive,
      createdAt: sql<string | null>`${users.createdAt}`.as("createdAt"),
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .then((rows) => rows[0] ?? null);
}

async function getPartnerHotels(partnerId: string): Promise<AdminPartnerHotelSummary[]> {
  const bookingCounts = db
    .select({
      hotelId: roomTypes.hotelId,
      value: sql<number>`count(${bookings.id})::int`.as("value"),
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .groupBy(roomTypes.hotelId)
    .as("admin_partner_hotel_booking_counts");
  const reviewCounts = db
    .select({
      hotelId: reviews.hotelId,
      value: sql<number>`count(${reviews.id})::int`.as("value"),
    })
    .from(reviews)
    .groupBy(reviews.hotelId)
    .as("admin_partner_hotel_review_counts");

  const rows = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      registeredAt: hotels.registeredAt,
      bookingsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_hotel_booking_counts")}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_partner_hotel_review_counts")}, 0)::int`.as("reviewsCount"),
    })
    .from(hotels)
    .leftJoin(bookingCounts, eq(bookingCounts.hotelId, hotels.id))
    .leftJoin(reviewCounts, eq(reviewCounts.hotelId, hotels.id))
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(asc(hotels.name));

  return rows.map((row) => ({
    ...row,
    registeredAt: toIsoString(row.registeredAt),
    bookingsCount: toNumber(row.bookingsCount),
    reviewsCount: toNumber(row.reviewsCount),
  }));
}

async function getPartnerBookings(
  partnerId: string
): Promise<AdminPartnerBookingSummary[]> {
  const rows = await db
    .select({
      id: bookings.id,
      userId: users.id,
      guestEmail: users.email,
      guestFullName: userProfiles.fullName,
      hotelName: hotels.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .innerJoin(users, eq(users.id, bookings.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(DETAIL_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    guestName: displayName(row.guestFullName, row.guestEmail),
    guestEmail: row.guestEmail,
    hotelName: row.hotelName,
    checkInDate: toDateString(row.checkInDate),
    checkOutDate: toDateString(row.checkOutDate),
    status: row.status,
    paymentStatus: row.paymentStatus,
    createdAt: toIsoString(row.createdAt),
  }));
}

async function getPartnerReviews(
  partnerId: string
): Promise<AdminPartnerReviewSummary[]> {
  const rows = await db
    .select({
      id: reviews.id,
      userId: users.id,
      reviewerEmail: users.email,
      reviewerFullName: userProfiles.fullName,
      hotelName: hotels.name,
      rating: reviews.rating,
      moderationStatus: reviews.moderationStatus,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(hotels.partnerId, partnerId))
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(DETAIL_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    reviewerName: displayName(row.reviewerFullName, row.reviewerEmail),
    reviewerEmail: row.reviewerEmail,
    hotelName: row.hotelName,
    rating: row.rating,
    moderationStatus: row.moderationStatus,
    commentPreview: commentPreview(row.comment),
    createdAt: toIsoString(row.createdAt),
  }));
}

export async function getAdminPartnerDetails(
  partnerId: string
): Promise<AdminPartnerDetails | null> {
  const row = await getPartnerBase(partnerId);
  if (!row) return null;

  const [linkedUser, hotels, bookings, reviews] = await Promise.all([
    getLinkedUser(row.userId),
    getPartnerHotels(row.id),
    getPartnerBookings(row.id),
    getPartnerReviews(row.id),
  ]);
  if (!linkedUser) return null;

  return {
    partner: {
      ...row,
      representativeName: `${row.representativeFirstName} ${row.representativeLastName}`.trim(),
      verificationStatus: toVerificationStatus(row.verificationStatus),
      createdAt: toIsoString(row.createdAt),
      updatedAt: toIsoString(row.updatedAt),
      hotelsCount: toNumber(row.hotelsCount),
      bookingsCount: toNumber(row.bookingsCount),
      reviewsCount: toNumber(row.reviewsCount),
    },
    linkedUser: { ...linkedUser, createdAt: toIsoString(linkedUser.createdAt) },
    hotels,
    bookings,
    reviews,
  };
}

export async function updateAdminPartner(
  partnerId: string,
  input: AdminPartnerUpdateInput
): Promise<AdminPartnerDetails> {
  const isVerified = input.verificationStatus === "verified";
  const updated = await db
    .update(partners)
    .set({
      verificationStatus: input.verificationStatus,
      isVerified,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId))
    .returning({ id: partners.id });

  if (!updated.length) throw new Error("PARTNER_NOT_FOUND");

  const partner = await getAdminPartnerDetails(partnerId);
  if (!partner) throw new Error("PARTNER_NOT_FOUND");
  return partner;
}
