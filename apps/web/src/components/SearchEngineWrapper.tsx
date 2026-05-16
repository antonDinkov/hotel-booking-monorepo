"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { SearchEngine } from "./SearchEngine";
import { ListingCard } from "./ListingCard";
import { Pagination } from "./Pagination";
import type { SearchField, Listing } from "../types/hotel-panel";

export function SearchEngineWrapper({
    searchFields,
    ctaLabel,
    favoriteHotelIds,
    canFavorite = false,
}: {
    searchFields: SearchField[];
    ctaLabel: string;
    featuredListings: Listing[];
    favoriteHotelIds?: number[];
    canFavorite?: boolean;
}) {
    const [searchResults, setSearchResults] = useState<Listing[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearchParams, setActiveSearchParams] = useState<{ checkInDate?: string; checkOutDate?: string; guests?: string }>({});
    const [error, setError] = useState<string | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<number[]>(() => favoriteHotelIds ?? []);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const resultsRef = useRef<HTMLElement | null>(null);

    const handleFavoriteChange = useCallback((hotelId: number, isFavorite: boolean) => {
        setFavoriteIds((current) => {
            if (isFavorite) return current.includes(hotelId) ? current : [...current, hotelId];
            return current.filter((id) => id !== hotelId);
        });
    }, []);

    const handlePageChange = useCallback((p: number) => {
        setCurrentPage(p);
        const el = resultsRef.current;
        if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [setCurrentPage]);

    const performSearch = useCallback(
        async (destination: string, checkInDate: string, checkOutDate: string, guestsCount: string) => {
            if (!destination.trim() || !checkInDate || !checkOutDate || !guestsCount) {
                setCurrentPage(1);
                setSearchResults([]);
                setSearchQuery("");
                setError(null);
                setActiveSearchParams({});
                return;
            }

            setCurrentPage(1);
            setIsSearching(true);
            setError(null);
            setSearchQuery(destination);
            setActiveSearchParams({ checkInDate, checkOutDate, guests: guestsCount });

            try {
                const params = new URLSearchParams({
                    destination: destination.trim(),
                    checkInDate,
                    checkOutDate,
                    guests: guestsCount,
                });

                const response = await fetch(`/api/search?${params.toString()}`);

                if (!response.ok) {
                    throw new Error(
                        `Search failed with status ${response.status}`
                    );
                }

                const results: Listing[] = await response.json();
                setSearchResults(results);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An error occurred during search";
                setError(errorMessage);
                console.error("Search error:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        []
    );

    const handleSearch = useCallback(
        (searchParams: {
            destination?: string;
            checkInDate?: string;
            checkOutDate?: string;
            guests?: string;
        }) => {
            // Clear previous debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            const destination = searchParams.destination || "";
            const checkInDate = searchParams.checkInDate || "";
            const checkOutDate = searchParams.checkOutDate || "";
            const guests = searchParams.guests || "";

            // Debounce search by 300ms
            debounceTimerRef.current = setTimeout(() => {
                performSearch(destination, checkInDate, checkOutDate, guests);
            }, 300);
        },
        [performSearch]
    );
    const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return searchResults.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, searchResults, itemsPerPage]);

    return (
        <>
            {/* Placement container: pages should render this component immediately under header/navigation */}
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <SearchEngine
                    searchFields={searchFields}
                    ctaLabel={ctaLabel}
                    onSearch={handleSearch}
                />
            </div>

            {/* Search Results Section */}
            {searchQuery && (
                <section ref={resultsRef} className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Search results for <span>{searchQuery}</span>
                        </h2>
                        <p className="mt-2 text-slate-600">
                            {isSearching ? "Loading..." : `Found ${searchResults.length} properties`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                            <p className="font-medium">Search Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {isSearching ? (
                        <div className="flex justify-center py-12">
                            <div className="text-slate-600">Loading results...</div>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {paginatedListings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={listing}
                                            searchParams={activeSearchParams}
                                            initialIsFavorite={favoriteSet.has(Number(listing.id))}
                                            canFavorite={canFavorite}
                                            onFavoriteChange={handleFavoriteChange}
                                        />
                                    ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.max(1, Math.ceil(searchResults.length / itemsPerPage))}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : !error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-lg text-slate-600">No properties found</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Try searching with different criteria
                            </p>
                        </div>
                    ) : null}
                </section>
            )}
        </>
    );
}
