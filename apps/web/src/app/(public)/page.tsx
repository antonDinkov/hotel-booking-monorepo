// Home page is guest-facing; authenticated users are redirected to `/dashboard`.
import { getHotelPanelData } from "@/server/services/hotelPanel";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { HeroSection } from "../../components/HeroSection";
import { FeaturedListings } from "../../components/FeaturedListings";
import { SearchEngineWrapper } from "../../components/SearchEngineWrapper";
import type { Listing, HotelPanelData } from "../../types/hotel-panel";

export default async function Home() {
  const auth = await authorize(["client", "admin"]);
  if (auth.ok) {
    redirect("/dashboard");
  }

  const panelData: HotelPanelData | null = await getHotelPanelData();
  if (!panelData) return null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      {/* Search placed directly under header/navigation */}
      <SearchEngineWrapper
        searchFields={panelData.searchFields}
        ctaLabel={panelData.search.cta}
        featuredListings={panelData.featuredListings}
      />

      <HeroSection hero={panelData.hero} />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
            {panelData.featuredHeading.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            {panelData.featuredHeading.subtitle}
          </p>
        </div>

        <FeaturedListings listings={panelData.featuredListings} itemsPerPage={6} />
      </section>

    </main>
  );
}
