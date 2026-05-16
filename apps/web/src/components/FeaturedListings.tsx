"use client";

import { useMemo, useState } from "react";
import type { Listing } from "../types/hotel-panel";
import { ListingCard } from "./ListingCard";
import { Pagination } from "./Pagination";

export function FeaturedListings({
    listings,
    itemsPerPage = 6,
    favoriteHotelIds = [],
    canFavorite = false,
}: {
    listings: Listing[];
    itemsPerPage?: number;
    favoriteHotelIds?: number[];
    canFavorite?: boolean;
}) {
    const [page, setPage] = useState(1);
    const [favoriteIds, setFavoriteIds] = useState(() => favoriteHotelIds ?? []);

    const handleFavoriteChange = (hotelId: number, isFavorite: boolean) => {
        setFavoriteIds((current) => {
            if (isFavorite) return current.includes(hotelId) ? current : [...current, hotelId];
            return current.filter((id) => id !== hotelId);
        });
    };

    const totalPages = Math.max(1, Math.ceil(listings.length / itemsPerPage));

    const start = (page - 1) * itemsPerPage;
    const paged = listings.slice(start, start + itemsPerPage);
    const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

    return (
        <>
            {listings.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center py-12">
                    <p className="text-lg text-slate-600">No featured properties</p>
                </div>
            ) : (
                <>
                    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {paged.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                initialIsFavorite={favoriteSet.has(Number(listing.id))}
                                canFavorite={canFavorite}
                                onFavoriteChange={handleFavoriteChange}
                            />
                        ))}
                    </div>

                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
                </>
            )}
        </>
    );
}
