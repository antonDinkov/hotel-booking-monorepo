"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListingCard } from "../../../components/ListingCard";
import type { Listing } from "../../../types/hotel-panel";

function ListingsContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const destination = searchParams.get("destination");
    setSearchQuery(destination ?? "");

    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = destination
          ? `/api/search?destination=${encodeURIComponent(destination)}`
          : "/api/search";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }

        const data = await response.json();
        setListings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {searchQuery ? `Search results for "${searchQuery}"` : "All Hotels"}
          </h1>
          <p className="mt-2 text-slate-600">
            {loading ? "Loading..." : `Found ${listings.length} properties`}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            <p>Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-slate-600">Loading listings...</div>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg text-slate-600">No properties found</p>
              <p className="mt-2 text-sm text-slate-500">
                Try searching with different criteria
              </p>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200/80 py-6 text-center text-sm text-slate-500">
        Copyright 2026 BookYourStay MVP | All Rights Reserved.
      </footer>
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
