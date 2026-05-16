import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getFavoriteHotelIds, getSavedHotels, getSavedHotelsCount } from "@/server/services/favorites";
import FavoritesPageClient from "./FavoritesPageClient";

const FAVORITES_PAGE_SIZE = 6;

function buildPagination(loaded: number, total: number) {
  const nextOffset = loaded < total ? loaded : null;
  return {
    limit: FAVORITES_PAGE_SIZE,
    offset: 0,
    nextOffset,
    hasMore: nextOffset !== null,
  };
}

export default async function FavoritesPage() {
  const auth = await authorize(["client"]);

  if (!auth.ok || !auth.userId) {
    redirect(auth.error === "unauthenticated" ? "/login" : "/");
  }

  const [hotels, total, favoriteHotelIds] = await Promise.all([
    getSavedHotels(auth.userId, { limit: FAVORITES_PAGE_SIZE, offset: 0 }),
    getSavedHotelsCount(auth.userId),
    getFavoriteHotelIds(auth.userId),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-blue-700">Saved Hotels</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Your favorite stays
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Revisit hotels you saved while planning your next trip.
        </p>
      </header>

      <FavoritesPageClient
        initialHotels={hotels}
        initialTotal={total}
        initialPagination={buildPagination(hotels.length, total)}
        initialFavoriteHotelIds={favoriteHotelIds}
      />
    </main>
  );
}
