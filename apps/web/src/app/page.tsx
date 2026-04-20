import Image from "next/image";
import { headers } from "next/headers";
import { AppButton } from "../components/app-button";
import { ListingCard } from "../components/listing-card";
import { SearchEngine } from "../components/search-engine";
import type { HotelPanelData, Listing } from "../types/hotel-panel";

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7 text-blue-700"
      fill="none"
    >
      <path
        d="M12 22s6.5-6.2 6.5-12A6.5 6.5 0 0 0 5.5 10c0 5.8 6.5 12 6.5 12Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 14.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

async function getPanelData(): Promise<HotelPanelData> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host for hotel panel API fetch.");
  }

  const response = await fetch(`${protocol}://${host}/api/hotel-panel`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load hotel panel data.");
  }

  return response.json() as Promise<HotelPanelData>;
}

export default async function Home() {
  const panelData = await getPanelData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 text-[1.15rem] font-extrabold tracking-tight text-blue-950">
            <BrandMark />
            {panelData.brand.name}
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#"
              className="rounded-lg border border-blue-700 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Sign Up
            </a>
            <AppButton variant="primary" size="md">
              {panelData.navigation.primaryAction}
            </AppButton>
            <AppButton variant="secondary" size="md" className="border-slate-200 hover:border-slate-300">
              {panelData.navigation.secondaryAction}
            </AppButton>
          </div>
        </div>
      </header>

      <section id="top" className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={panelData.hero.image.src}
            alt={panelData.hero.image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,20,48,0.52)_0%,rgba(12,20,48,0.25)_40%,rgba(12,20,48,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_35%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:min-h-[680px] lg:pb-32 lg:pt-24">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
              {panelData.hero.eyebrow}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight drop-shadow sm:text-5xl lg:text-6xl">
              {panelData.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
              {panelData.hero.description}
            </p>
          </div>

          <SearchEngine searchFields={panelData.searchFields} ctaLabel={panelData.search.cta} />
        </div>
      </section>

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
