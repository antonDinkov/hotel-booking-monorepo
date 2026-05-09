import { SearchEngineWrapper } from "@/components/SearchEngineWrapper";
import { FeaturedListings } from "@/components/FeaturedListings";
import { getHotelPanelData } from "@/server/services/hotelPanel";
import type { HotelPanelData } from "@/types/hotel-panel";

export default async function DashboardPage() {
    const panelData: HotelPanelData | null = await getHotelPanelData();

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            {/* Search placed directly under header/navigation */}
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            </header>
            {panelData ? (
                <SearchEngineWrapper
                    searchFields={panelData.searchFields}
                    ctaLabel={panelData.search.cta}
                    featuredListings={panelData.featuredListings}
                />
            ) : null}


            <section className="mt-10 mb-8">
                <p className="mt-2 text-sm text-slate-600 font-semibold">
                    Track your upcoming stays, manage bookings, and review your preferences.
                </p>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Upcoming Trips</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
                    <p className="mt-2 text-xs text-slate-500">No upcoming stays yet.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Saved Hotels</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
                    <p className="mt-2 text-xs text-slate-500">Browse listings to save favorites.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Reviews</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
                    <p className="mt-2 text-xs text-slate-500">Share feedback after a stay.</p>
                </div>
            </section>

            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
                <div className="mt-4 grid gap-3 grid-cols-2">
                    <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        Review a recent booking
                    </button>
                    <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        Update profile preferences
                    </button>
                </div>
            </section>

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
