import { getPanelData } from "../api/hotel-panel";
import { HeroSection } from "../components/hero-section";
import { HeaderNavigation } from "../components/header-navigation";
import { ListingCard } from "../components/listing-card";
import { SearchEngine } from "../components/search-engine";
import type { Listing } from "../types/hotel-panel";

export default async function Home() {
  const panelData = await getPanelData();
  const isLoggedIn = false;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <HeaderNavigation
        brandName={panelData.brand.name}
        navigation={panelData.navigation}
        isLoggedIn={isLoggedIn}
        userName="Alex"
      />

      <HeroSection hero={panelData.hero}>
        <SearchEngine searchFields={panelData.searchFields} ctaLabel={panelData.search.cta} />
      </HeroSection>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
            {panelData.featuredHeading.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{panelData.featuredHeading.subtitle}</p>
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
