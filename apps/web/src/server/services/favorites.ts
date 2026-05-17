import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { favoriteHotels, hotelImages, hotels, roles, userRoles } from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import type { FavoriteMutationResult, FavoritePaginationInput } from "@/types/favorite";
import type { Listing } from "@/types/hotel-panel";
import { getHotelReviewSummariesByHotelIds } from "./reviews";

const DEFAULT_PAGE_LIMIT = 6;
const MAX_PAGE_LIMIT = 24;
const DEFAULT_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

function assertAuthenticatedUser(userId: string): void {
  if (!userId.trim()) {
    throw new Error("UNAUTHORIZED");
  }
}

function normalizePagination(input: FavoritePaginationInput): Required<FavoritePaginationInput> {
  const requestedLimit = input.limit ?? DEFAULT_PAGE_LIMIT;
  const requestedOffset = input.offset ?? 0;

  return {
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT,
    offset: Number.isInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0,
  };
}

function validateHotelId(hotelId: number): void {
  if (!Number.isInteger(hotelId) || hotelId < 1) {
    throw new Error("INVALID_HOTEL_ID");
  }
}

async function assertClientUser(userId: string): Promise<void> {
  assertAuthenticatedUser(userId);

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

async function assertHotelExists(hotelId: number): Promise<void> {
  validateHotelId(hotelId);

  const hotel = await db
    .select({ id: hotels.id })
    .from(hotels)
    .where(eq(hotels.id, hotelId))
    .then((rows) => rows[0]);

  if (!hotel) {
    throw new Error("HOTEL_NOT_FOUND");
  }
}

async function getCoverImagesByHotelId(hotelIds: number[]): Promise<Map<number, string>> {
  if (hotelIds.length === 0) return new Map();

  const rows = await db
    .select({
      hotelId: hotelImages.hotelId,
      imageUrl: hotelImages.imageKey,
    })
    .from(hotelImages)
    .where(and(inArray(hotelImages.hotelId, hotelIds), isNull(hotelImages.roomTypeId)))
    .orderBy(desc(hotelImages.isCover), asc(hotelImages.sortOrder), asc(hotelImages.id));

  const imagesByHotelId = new Map<number, string>();
  for (const row of rows) {
    if (!imagesByHotelId.has(row.hotelId)) {
      imagesByHotelId.set(row.hotelId, resolveImageUrl(row.imageUrl));
    }
  }

  return imagesByHotelId;
}

async function getListingsForHotelIds(hotelIds: number[]): Promise<Listing[]> {
  if (hotelIds.length === 0) return [];

  const [hotelRows, imagesByHotelId, reviewSummaries] = await Promise.all([
    db
      .select({ id: hotels.id, name: hotels.name, location: hotels.location })
      .from(hotels)
      .where(inArray(hotels.id, hotelIds)),
    getCoverImagesByHotelId(hotelIds),
    getHotelReviewSummariesByHotelIds(hotelIds),
  ]);

  const listingsById = new Map<number, Listing>();
  for (const hotel of hotelRows) {
    const summary = reviewSummaries.get(hotel.id);
    if (!summary) continue;

    listingsById.set(hotel.id, {
      id: String(hotel.id),
      name: hotel.name,
      category: hotel.location,
      rating: summary.averageRating,
      ratingLabel: summary.ratingLabel,
      reviewLabel: summary.reviewLabel,
      trustBadge: summary.trustBadge,
      image: {
        src: imagesByHotelId.get(hotel.id) ?? DEFAULT_HOTEL_IMAGE,
        alt: `${hotel.name} cover image`,
      },
    });
  }

  return hotelIds.map((hotelId) => listingsById.get(hotelId)).filter((listing): listing is Listing => Boolean(listing));
}

export async function getFavoriteHotelIds(userId: string): Promise<number[]> {
  await assertClientUser(userId);

  const rows = await db
    .select({ hotelId: favoriteHotels.hotelId })
    .from(favoriteHotels)
    .where(eq(favoriteHotels.userId, userId));

  return rows.map((row) => row.hotelId);
}

export async function getSavedHotels(
  userId: string,
  pagination: FavoritePaginationInput = {}
): Promise<Listing[]> {
  await assertClientUser(userId);
  const { limit, offset } = normalizePagination(pagination);

  const rows = await db
    .select({ hotelId: favoriteHotels.hotelId })
    .from(favoriteHotels)
    .where(eq(favoriteHotels.userId, userId))
    .orderBy(desc(favoriteHotels.createdAt), desc(favoriteHotels.hotelId))
    .limit(limit)
    .offset(offset);

  return getListingsForHotelIds(rows.map((row) => row.hotelId));
}

export async function getSavedHotelsCount(userId: string): Promise<number> {
  await assertClientUser(userId);

  const row = await db
    .select({ favoriteCount: sql<string>`count(*)` })
    .from(favoriteHotels)
    .where(eq(favoriteHotels.userId, userId))
    .then((rows) => rows[0]);

  return Number(row?.favoriteCount ?? 0);
}

export async function addFavoriteHotel(userId: string, hotelId: number): Promise<FavoriteMutationResult> {
  await assertClientUser(userId);
  await assertHotelExists(hotelId);

  await db
    .insert(favoriteHotels)
    .values({ userId, hotelId })
    .onConflictDoNothing();

  return { hotelId, isFavorite: true };
}

export async function removeFavoriteHotel(userId: string, hotelId: number): Promise<FavoriteMutationResult> {
  await assertClientUser(userId);
  await assertHotelExists(hotelId);

  await db
    .delete(favoriteHotels)
    .where(and(eq(favoriteHotels.userId, userId), eq(favoriteHotels.hotelId, hotelId)));

  return { hotelId, isFavorite: false };
}

export async function toggleFavoriteHotel(userId: string, hotelId: number): Promise<FavoriteMutationResult> {
  await assertClientUser(userId);
  await assertHotelExists(hotelId);

  const existing = await db
    .select({ hotelId: favoriteHotels.hotelId })
    .from(favoriteHotels)
    .where(and(eq(favoriteHotels.userId, userId), eq(favoriteHotels.hotelId, hotelId)))
    .then((rows) => rows[0]);

  if (existing) {
    return removeFavoriteHotel(userId, hotelId);
  }

  return addFavoriteHotel(userId, hotelId);
}
