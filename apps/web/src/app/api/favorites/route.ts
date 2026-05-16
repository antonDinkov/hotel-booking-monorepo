import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import {
  addFavoriteHotel,
  getFavoriteHotelIds,
  getSavedHotels,
  getSavedHotelsCount,
  removeFavoriteHotel,
  toggleFavoriteHotel,
} from "@/server/services/favorites";
import {
  apiError,
  authError,
  mapFavoriteError,
  parseFavoriteHotelBody,
  parseFavoriteHotelQuery,
  parseFavoritesPageQuery,
  shouldReturnFavoriteIds,
} from "./favorite-api-helpers";

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function buildPagination(limit: number, offset: number, loaded: number, total: number) {
  const nextOffset = offset + loaded < total ? offset + loaded : null;
  return { limit, offset, nextOffset, hasMore: nextOffset !== null };
}

export async function GET(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  const searchParams = new URL(request.url).searchParams;
  if (shouldReturnFavoriteIds(searchParams)) {
    try {
      const hotelIds = await getFavoriteHotelIds(auth.userId as string);
      return NextResponse.json({ data: { hotelIds } });
    } catch (error) {
      return mapFavoriteError(error);
    }
  }

  const parsed = parseFavoritesPageQuery(searchParams);
  if (!parsed.success) return apiError("Invalid favorites query", "VALIDATION_ERROR", 400);

  try {
    const [hotels, total] = await Promise.all([
      getSavedHotels(auth.userId as string, parsed.data),
      getSavedHotelsCount(auth.userId as string),
    ]);

    return NextResponse.json({
      data: {
        hotels,
        total,
        pagination: buildPagination(parsed.data.limit, parsed.data.offset, hotels.length, total),
      },
    });
  } catch (error) {
    return mapFavoriteError(error);
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  const parsed = parseFavoriteHotelBody(await readJsonBody(request));
  if (!parsed.success) return apiError("Missing or invalid hotel ID", "VALIDATION_ERROR", 400);

  try {
    const favorite = await addFavoriteHotel(auth.userId as string, parsed.data.hotelId);
    return NextResponse.json({ data: favorite }, { status: 201 });
  } catch (error) {
    return mapFavoriteError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  const searchParams = new URL(request.url).searchParams;
  let parsed = parseFavoriteHotelQuery(searchParams);
  if (!parsed.success) parsed = parseFavoriteHotelBody(await readJsonBody(request));
  if (!parsed.success) return apiError("Missing or invalid hotel ID", "VALIDATION_ERROR", 400);

  try {
    const favorite = await removeFavoriteHotel(auth.userId as string, parsed.data.hotelId);
    return NextResponse.json({ data: favorite });
  } catch (error) {
    return mapFavoriteError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  const parsed = parseFavoriteHotelBody(await readJsonBody(request));
  if (!parsed.success) return apiError("Missing or invalid hotel ID", "VALIDATION_ERROR", 400);

  try {
    const favorite = await toggleFavoriteHotel(auth.userId as string, parsed.data.hotelId);
    return NextResponse.json({ data: favorite });
  } catch (error) {
    return mapFavoriteError(error);
  }
}
