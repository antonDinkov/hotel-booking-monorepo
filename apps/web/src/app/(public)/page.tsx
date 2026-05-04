"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "../../components/hero-section";
import { ListingCard } from "../../components/listing-card";
import { SearchEngineWrapper } from "../../components/search-engine-wrapper";
import type { Listing, HotelPanelData } from "../../types/hotel-panel";

export default function Home() {
  const [panelData, setPanelData] = useState<HotelPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/hotel-panel");
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Failed to fetch panel data (${res.status})`);
        }
        const data: HotelPanelData = await res.json();
        if (mounted) setPanelData(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">Loading…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-red-600">Error: {error}</div>
      </main>
    );
  }

  if (!panelData) return null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <HeroSection hero={panelData.hero}>
        <SearchEngineWrapper
          searchFields={panelData.searchFields}
          ctaLabel={panelData.search.cta}
          featuredListings={panelData.featuredListings}
        />
      </HeroSection>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
            {panelData.featuredHeading.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            {panelData.featuredHeading.subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {panelData.featuredListings.map((listing: Listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200/80 py-6 text-center text-sm text-slate-500">
        {panelData.footer.text}
      </footer>
    </main>
  );
}
