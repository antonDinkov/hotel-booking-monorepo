import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
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
  roles,
  roomTypes,
  userProfiles,
  userRoles,
  users,
} from "@/db/schema";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import type {
  AdminUserBookingSummary,
  AdminUserDetails,
  AdminUserFilterCounts,
  AdminUserListFilters,
  AdminUserListItem,
  AdminUserPartnerProfile,
  AdminUserReviewSummary,
  AdminUserUpdateInput,
} from "@/types/admin-users";

const DETAIL_LIMIT = 8;

type UserListRow = Omit<AdminUserListItem, "roles">;

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

function roleExistsCondition(role: string): SQL {
  return sql`exists (
    select 1 from ${userRoles}
    inner join ${roles} on ${roles.id} = ${userRoles.roleId}
    where ${userRoles.userId} = ${users.id}
      and ${roles.name} = ${role}
  )`;
}

function buildUserConditions(filters: AdminUserListFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.role) conditions.push(roleExistsCondition(filters.role));
  if (filters.active === "active") conditions.push(eq(users.isActive, true));
  if (filters.active === "inactive") conditions.push(eq(users.isActive, false));
  if (filters.createdFrom) conditions.push(gte(users.createdAt, parseDateOnly(filters.createdFrom)));
  if (filters.createdTo) conditions.push(lte(users.createdAt, addEndOfDay(filters.createdTo)));
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(or(ilike(users.email, pattern), ilike(userProfiles.fullName, pattern)) as SQL);
  }

  return conditions;
}

function getUserSortOrder(sort: AdminUserListFilters["sort"]): SQL[] {
  if (sort === "oldest") return [asc(users.createdAt), asc(users.email)];
  if (sort === "email") return [asc(users.email), asc(users.createdAt)];
  if (sort === "role") {
    return [
      sql`(select min(${roles.name}) from ${userRoles}
        inner join ${roles} on ${roles.id} = ${userRoles.roleId}
        where ${userRoles.userId} = ${users.id}) asc`,
      asc(users.email),
    ];
  }

  return [desc(users.createdAt), desc(users.id)];
}

function bookingCountSubquery() {
  return db
    .select({
      userId: bookings.userId,
      value: sql<number>`count(${bookings.id})::int`.as("value"),
    })
    .from(bookings)
    .groupBy(bookings.userId)
    .as("admin_user_booking_counts");
}

function reviewCountSubquery() {
  return db
    .select({
      userId: reviews.userId,
      value: sql<number>`count(${reviews.id})::int`.as("value"),
    })
    .from(reviews)
    .groupBy(reviews.userId)
    .as("admin_user_review_counts");
}

function scopedSubqueryValue(alias: string) {
  return sql.raw(`"${alias}"."value"`);
}

function mapUserRow(row: UserListRow, rolesByUserId: Map<string, string[]>): AdminUserListItem {
  return {
    ...row,
    roles: rolesByUserId.get(row.id) ?? [],
  };
}

async function getRolesForUsers(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  const rows = await db
    .select({ userId: userRoles.userId, role: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(inArray(userRoles.userId, userIds))
    .orderBy(asc(roles.name));

  return rows.reduce((map, row) => {
    map.set(row.userId, [...(map.get(row.userId) ?? []), row.role]);
    return map;
  }, new Map<string, string[]>());
}

async function countFilteredUsers(filters: AdminUserListFilters): Promise<number> {
  const row = await db
    .select({ value: sql<number>`count(distinct ${users.id})::int` })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...buildUserConditions(filters)))
    .then((rows) => rows[0]);

  return toNumber(row?.value);
}

async function getUserFilterCounts(): Promise<AdminUserFilterCounts> {
  const [statusRows, roleRows] = await Promise.all([
    db
      .select({ isActive: users.isActive, value: sql<number>`count(*)::int` })
      .from(users)
      .groupBy(users.isActive),
    db
      .select({ role: roles.name, value: sql<number>`count(distinct ${userRoles.userId})::int` })
      .from(roles)
      .leftJoin(userRoles, eq(userRoles.roleId, roles.id))
      .groupBy(roles.name),
  ]);

  const roleCount = (role: string) => toNumber(roleRows.find((row) => row.role === role)?.value);
  const active = toNumber(statusRows.find((row) => row.isActive)?.value);
  const inactive = toNumber(statusRows.find((row) => !row.isActive)?.value);

  return {
    total: active + inactive,
    clients: roleCount("client"),
    partners: roleCount("partner"),
    admins: roleCount("admin"),
    active,
    inactive,
  };
}

async function getUserRows(
  filters: AdminUserListFilters,
  page: number
): Promise<UserListRow[]> {
  const bookingCounts = bookingCountSubquery();
  const reviewCounts = reviewCountSubquery();

  return db
    .select({
      id: users.id,
      email: users.email,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      isActive: users.isActive,
      createdAt: sql<string | null>`${users.createdAt}`.as("createdAt"),
      bookingsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_user_booking_counts")}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_user_review_counts")}, 0)::int`.as("reviewsCount"),
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(bookingCounts, eq(bookingCounts.userId, users.id))
    .leftJoin(reviewCounts, eq(reviewCounts.userId, users.id))
    .where(and(...buildUserConditions(filters)))
    .orderBy(...getUserSortOrder(filters.sort))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize)
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        createdAt: toIsoString(row.createdAt),
        bookingsCount: toNumber(row.bookingsCount),
        reviewsCount: toNumber(row.reviewsCount),
      }))
    );
}

export async function listAdminUsers(
  filters: AdminUserListFilters
): Promise<import("@/types/admin-users").AdminUserListResult> {
  const [totalItems, counts] = await Promise.all([
    countFilteredUsers(filters),
    getUserFilterCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const rows = await getUserRows(filters, page);
  const rolesByUserId = await getRolesForUsers(rows.map((row) => row.id));

  return {
    users: rows.map((row) => mapUserRow(row, rolesByUserId)),
    filters: { ...filters, page },
    pagination: { page, pageSize: filters.pageSize, totalItems, totalPages },
    counts,
  };
}

async function getUserAccount(userId: string): Promise<AdminUserListItem | null> {
  const row = await getUserRowsForId(userId);
  if (!row) return null;

  const rolesByUserId = await getRolesForUsers([userId]);
  return mapUserRow(row, rolesByUserId);
}

async function getUserRowsForId(userId: string): Promise<UserListRow | null> {
  const bookingCounts = bookingCountSubquery();
  const reviewCounts = reviewCountSubquery();
  const row = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      isActive: users.isActive,
      createdAt: sql<string | null>`${users.createdAt}`.as("createdAt"),
      bookingsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_user_booking_counts")}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${scopedSubqueryValue("admin_user_review_counts")}, 0)::int`.as("reviewsCount"),
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(bookingCounts, eq(bookingCounts.userId, users.id))
    .leftJoin(reviewCounts, eq(reviewCounts.userId, users.id))
    .where(eq(users.id, userId))
    .then((rows) => rows[0] ?? null);

  return row
    ? {
        ...row,
        createdAt: toIsoString(row.createdAt),
        bookingsCount: toNumber(row.bookingsCount),
        reviewsCount: toNumber(row.reviewsCount),
      }
    : null;
}

async function getUserProfile(userId: string) {
  return db
    .select({
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      nationality: userProfiles.nationality,
      dateOfBirth: userProfiles.dateOfBirth,
      gender: userProfiles.gender,
      city: userProfiles.city,
      country: userProfiles.country,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .then((rows) => rows[0] ?? null);
}

async function getUserBookings(userId: string): Promise<AdminUserBookingSummary[]> {
  const rows = await db
    .select({
      id: bookings.id,
      hotelId: hotels.id,
      hotelName: hotels.name,
      roomTypeName: roomTypes.name,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt), desc(bookings.id))
    .limit(DETAIL_LIMIT);

  return rows.map((row) => ({
    ...row,
    checkInDate: toDateString(row.checkInDate),
    checkOutDate: toDateString(row.checkOutDate),
    createdAt: toIsoString(row.createdAt),
  }));
}

async function getUserReviews(userId: string): Promise<AdminUserReviewSummary[]> {
  const rows = await db
    .select({
      id: reviews.id,
      hotelId: reviews.hotelId,
      hotelName: hotels.name,
      rating: reviews.rating,
      moderationStatus: reviews.moderationStatus,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .leftJoin(hotels, eq(hotels.id, reviews.hotelId))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(DETAIL_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    hotelId: row.hotelId,
    hotelName: row.hotelName,
    rating: row.rating,
    moderationStatus: row.moderationStatus,
    commentPreview: commentPreview(row.comment),
    createdAt: toIsoString(row.createdAt),
  }));
}

function partnerHotelCountSubquery() {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${hotels.id})::int`.as("value"),
    })
    .from(hotels)
    .groupBy(hotels.partnerId)
    .as("admin_user_partner_hotel_counts");
}

function partnerBookingCountSubquery() {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${bookings.id})::int`.as("value"),
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .groupBy(hotels.partnerId)
    .as("admin_user_partner_booking_counts");
}

function partnerReviewCountSubquery() {
  return db
    .select({
      partnerId: hotels.partnerId,
      value: sql<number>`count(${reviews.id})::int`.as("value"),
    })
    .from(reviews)
    .innerJoin(hotels, eq(hotels.id, reviews.hotelId))
    .groupBy(hotels.partnerId)
    .as("admin_user_partner_review_counts");
}

async function getUserPartnerProfile(
  userId: string
): Promise<AdminUserPartnerProfile | null> {
  const hotelCounts = partnerHotelCountSubquery();
  const bookingCounts = partnerBookingCountSubquery();
  const reviewCounts = partnerReviewCountSubquery();
  const row = await db
    .select({
      id: partners.id,
      companyName: partners.companyName,
      representativeFirstName: partners.representativeFirstName,
      representativeLastName: partners.representativeLastName,
      email: partners.email,
      phone: partners.phone,
      website: partners.website,
      verificationStatus: partners.verificationStatus,
      isVerified: partners.isVerified,
      hotelsCount: sql<number>`coalesce(${hotelCounts.value}, 0)::int`.as("hotelsCount"),
      bookingsCount: sql<number>`coalesce(${bookingCounts.value}, 0)::int`.as("bookingsCount"),
      reviewsCount: sql<number>`coalesce(${reviewCounts.value}, 0)::int`.as("reviewsCount"),
    })
    .from(partners)
    .leftJoin(hotelCounts, eq(hotelCounts.partnerId, partners.id))
    .leftJoin(bookingCounts, eq(bookingCounts.partnerId, partners.id))
    .leftJoin(reviewCounts, eq(reviewCounts.partnerId, partners.id))
    .where(eq(partners.userId, userId))
    .then((rows) => rows[0] ?? null);

  return row
    ? {
        ...row,
        representativeName: `${row.representativeFirstName} ${row.representativeLastName}`.trim(),
        verificationStatus: row.verificationStatus as AdminUserPartnerProfile["verificationStatus"],
        hotelsCount: toNumber(row.hotelsCount),
        bookingsCount: toNumber(row.bookingsCount),
        reviewsCount: toNumber(row.reviewsCount),
      }
    : null;
}

export async function getAdminUserDetails(
  userId: string
): Promise<AdminUserDetails | null> {
  const account = await getUserAccount(userId);
  if (!account) return null;

  const [profileRow, bookings, reviews, partnerProfile] = await Promise.all([
    getUserProfile(userId),
    getUserBookings(userId),
    getUserReviews(userId),
    getUserPartnerProfile(userId),
  ]);

  return {
    account,
    profile: {
      fullName: profileRow?.fullName ?? null,
      phone: profileRow?.phone ?? null,
      nationality: profileRow?.nationality ?? null,
      dateOfBirth: profileRow?.dateOfBirth ? toDateString(profileRow.dateOfBirth) : null,
      gender: profileRow?.gender ?? null,
      city: profileRow?.city ?? null,
      country: profileRow?.country ?? null,
    },
    bookings,
    reviews,
    partnerProfile,
  };
}

export async function updateAdminUser(
  userId: string,
  input: AdminUserUpdateInput
): Promise<AdminUserDetails> {
  const updated = await db
    .update(users)
    .set({ isActive: input.isActive })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!updated.length) throw new Error("USER_NOT_FOUND");

  const user = await getAdminUserDetails(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}
