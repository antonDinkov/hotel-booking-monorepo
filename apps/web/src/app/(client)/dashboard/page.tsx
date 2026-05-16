import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchEngineWrapper } from "@/components/SearchEngineWrapper";
import { FeaturedListings } from "@/components/FeaturedListings";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { getHotelPanelData } from "@/server/services/hotelPanel";
import { getBookings } from "@/server/services/bookings";
import { getMyReviewsCount } from "@/server/services/reviews";
import { getFavoriteHotelIds, getSavedHotelsCount } from "@/server/services/favorites";

export default async function DashboardPage() {
    const auth = await authorize(["client"]);

    if (!auth.ok || !auth.userId) {
        redirect("/login");
    }

    const [panelData, bookings, myReviewsCount, savedHotelsCount, favoriteHotelIds] = await Promise.all([
        getHotelPanelData(),
        getBookings(auth.userId),
        getMyReviewsCount(auth.userId),
        getSavedHotelsCount(auth.userId),
        getFavoriteHotelIds(auth.userId),
    ]);
    const upcomingTripsCount = bookings.filter((booking) => booking.status === "upcoming").length;

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
                    favoriteHotelIds={favoriteHotelIds}
                    canFavorite
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
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{upcomingTripsCount}</p>
                    <p className="mt-2 text-xs text-slate-500">
                        {upcomingTripsCount > 0
                            ? `${upcomingTripsCount} upcoming trip${upcomingTripsCount === 1 ? "" : "s"} planned.`
                            : "No upcoming stays yet."}
                    </p>
                </div>
                <Link
                    href="/favorites"
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <p className="text-sm font-semibold text-slate-500">Saved Hotels</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{savedHotelsCount}</p>
                    <p className="mt-2 text-xs text-slate-500">
                        {savedHotelsCount > 0
                            ? `View ${savedHotelsCount} saved hotel${savedHotelsCount === 1 ? "" : "s"}.`
                            : "Browse listings to save favorites."}
                    </p>
                </Link>
                <Link
                    href="/reviews/me"
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <p className="text-sm font-semibold text-slate-500">My Reviews</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{myReviewsCount}</p>
                    <p className="mt-2 text-xs text-slate-500">
                        {myReviewsCount > 0
                            ? `View ${myReviewsCount} review${myReviewsCount === 1 ? "" : "s"} you have shared.`
                            : "Share feedback after a stay."}
                    </p>
                </Link>
            </section>


            {panelData ? (
                <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:pt-24">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
                            {panelData.featuredHeading.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 sm:text-base">
                            {panelData.featuredHeading.subtitle}
                        </p>
                    </div>

                    <FeaturedListings
                        listings={panelData.featuredListings}
                        itemsPerPage={6}
                        favoriteHotelIds={favoriteHotelIds}
                        canFavorite
                    />
                </section>
            ) : null}
        </main>
    );
}
