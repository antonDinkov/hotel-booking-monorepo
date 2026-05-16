"use client";

import { useState } from "react";

import { AppButton } from "@/components/AppButton";
import { ListingCard } from "@/components/ListingCard";
import type { FavoritePagination, SavedHotelsPage } from "@/types/favorite";
import type { Listing } from "@/types/hotel-panel";

interface FavoritesPageClientProps {
  initialHotels: Listing[];
  initialTotal: number;
  initialPagination: FavoritePagination;
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

export default function FavoritesPageClient({
  initialHotels,
  initialTotal,
  initialPagination,
  initialFavoriteHotelIds,
}: FavoritesPageClientProps) {
  const [hotels, setHotels] = useState(initialHotels);
  const [total, setTotal] = useState(initialTotal);
  const [pagination, setPagination] = useState(initialPagination);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteHotelIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFavoriteChange = (hotelId: number, isFavorite: boolean) => {
    setFavoriteIds((current) => updateFavoriteIds(current, hotelId, isFavorite));

    if (!isFavorite) {
      const nextLoadedCount = Math.max(0, hotels.length - 1);
      setHotels((current) => current.filter((hotel) => Number(hotel.id) !== hotelId));
      setTotal((current) => Math.max(0, current - 1));
      setPagination((current) => current.hasMore
        ? { ...current, nextOffset: nextLoadedCount }
        : current
      );
    }
  };

  const handleShowMore = async () => {
    if (isLoading || pagination.nextOffset === null) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(pagination.limit),
      offset: String(pagination.nextOffset),
    });

    try {
      const response = await fetch(`/api/favorites?${params.toString()}`);
      const payload = await response.json().catch(() => null) as FavoritesPayload | null;
      const data = payload?.data;

      if (!response.ok || !data) {
        throw new Error(payload?.error?.message ?? "Unable to load saved hotels.");
      }

      setHotels((current) => [...current, ...data.hotels]);
      setTotal(data.total);
      setPagination(data.pagination);
      setFavoriteIds((current) => {
        const loadedIds = data.hotels.map((hotel) => Number(hotel.id));
        return Array.from(new Set([...current, ...loadedIds]));
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load saved hotels.");
    } finally {
      setIsLoading(false);
    }
  };

  const favoriteSet = new Set(favoriteIds);

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

      {pagination.hasMore ? (
        <div className="mt-8 flex justify-center">
          <AppButton variant="secondary" size="md" onClick={handleShowMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Show more"}
          </AppButton>
        </div>
      ) : null}
    </section>
  );
}
