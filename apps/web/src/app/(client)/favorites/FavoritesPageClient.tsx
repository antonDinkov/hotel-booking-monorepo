"use client";

import { useState } from "react";

import { ListingCard } from "@/components/ListingCard";
import type { SavedHotelsPage } from "@/types/favorite";
import type { Listing } from "@/types/hotel-panel";

interface FavoritesPageClientProps {
  initialHotels: Listing[];
  initialTotal: number;
  pageSize: number;
  initialFavoriteHotelIds: number[];
}

type FavoritesPayload = {
  data?: SavedHotelsPage;
  error?: {
    message?: string;
  };
};

function updateFavoriteIds(current: number[], hotelId: number, isFavorite: boolean) {
  if (isFavorite) return current.includes(hotelId) ? current : [...current, hotelId];
  return current.filter((id) => id !== hotelId);
}

function getPageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

function getOffsetForPage(page: number, pageSize: number) {
  return Math.max(0, (page - 1) * pageSize);
}

export default function FavoritesPageClient({
  initialHotels,
  initialTotal,
  pageSize,
  initialFavoriteHotelIds,
}: FavoritesPageClientProps) {
  const [hotels, setHotels] = useState(initialHotels);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteHotelIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalPages = getPageCount(total, pageSize);

  const loadFavoritesPage = async (page: number) => {
    if (isLoading || page < 1 || page > totalPages || page === currentPage) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(getOffsetForPage(page, pageSize)),
    });

    try {
      const response = await fetch(`/api/favorites?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as FavoritesPayload | null;
      const data = payload?.data;

      if (!response.ok || !data) {
        throw new Error(payload?.error?.message ?? "Unable to load saved hotels.");
      }

      setHotels(data.hotels);
      setTotal(data.total);
      setFavoriteIds((current) => {
        const loadedIds = data.hotels.map((hotel) => Number(hotel.id));
        return Array.from(new Set([...current, ...loadedIds]));
      });
      setCurrentPage(page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load saved hotels.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    void loadFavoritesPage(page);
  };

  const handleFavoriteChange = (hotelId: number, isFavorite: boolean) => {
    setFavoriteIds((current) => updateFavoriteIds(current, hotelId, isFavorite));

    if (!isFavorite) {
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = getPageCount(nextTotal, pageSize);

      if (currentPage > 1 && hotels.length <= 1) {
        void loadFavoritesPage(Math.min(currentPage - 1, nextTotalPages));
        return;
      }

      if (currentPage > nextTotalPages) {
        void loadFavoritesPage(nextTotalPages);
        return;
      }

      setHotels((current) => current.filter((hotel) => Number(hotel.id) !== hotelId));
      setTotal(nextTotal);
    }
  };

  const favoriteSet = new Set(favoriteIds);
  const hasMultiplePages = totalPages > 1;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-600">
          {total} saved hotel{total === 1 ? "" : "s"}
        </p>
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-slate-900">No saved hotels yet</p>
          <p className="mt-2 text-sm text-slate-600">Save hotels from listings to find them here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {hotels.map((hotel) => (
            <ListingCard
              key={hotel.id}
              listing={hotel}
              initialIsFavorite={favoriteSet.has(Number(hotel.id))}
              canFavorite
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}

      {error ? (
        <p className="mt-6 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {hasMultiplePages ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isLoading || currentPage === 1}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              type="button"
              key={page}
              className={`min-w-10 rounded-md px-3 py-2 text-sm font-medium transition ${
                page === currentPage
                  ? "bg-blue-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => handlePageChange(page)}
              disabled={isLoading || page === currentPage}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLoading || currentPage === totalPages}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
