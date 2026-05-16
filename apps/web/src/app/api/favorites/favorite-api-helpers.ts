import { NextResponse } from "next/server";
import { z } from "zod";

const favoriteHotelIdSchema = z.object({
  hotelId: z.coerce.number().int().positive(),
});

const favoritesPageQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(24).default(6),
  offset: z.coerce.number().int().min(0).default(0),
});

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function authError(status?: number) {
  return status === 401
    ? apiError("Unauthorized", "UNAUTHORIZED", 401)
    : apiError("Forbidden", "FORBIDDEN", 403);
}

export function parseFavoriteHotelBody(body: unknown) {
  return favoriteHotelIdSchema.safeParse(body);
}

export function parseFavoriteHotelQuery(searchParams: URLSearchParams) {
  return favoriteHotelIdSchema.safeParse({
    hotelId: searchParams.get("hotelId") ?? undefined,
  });
}

export function parseFavoritesPageQuery(searchParams: URLSearchParams) {
  return favoritesPageQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
}

export function shouldReturnFavoriteIds(searchParams: URLSearchParams): boolean {
  const value = searchParams.get("ids") ?? searchParams.get("format");
  return value === "1" || value === "true" || value === "ids";
}

export function mapFavoriteError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "UNAUTHORIZED") return apiError("Unauthorized", code, 401);
  if (code === "CLIENT_ROLE_REQUIRED") return apiError("Forbidden", "FORBIDDEN", 403);
  if (code === "INVALID_HOTEL_ID") return apiError("Invalid hotel ID", code, 400);
  if (code === "HOTEL_NOT_FOUND") return apiError("Hotel not found", code, 404);

  console.error("Favorite operation failed:", error);
  return apiError("Favorite operation failed", "FAVORITE_OPERATION_FAILED", 500);
}
