import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { BookingsClient } from "./BookingsClient";
import { getClientBookingsPage } from "@/server/services/bookings";

type BookingsPageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingsPage(
    { searchParams }: BookingsPageProps = { searchParams: Promise.resolve({}) }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const resolvedSearchParams = await searchParams;
    const pageParam = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
    const page = Number(pageParam);
    const result = await getClientBookingsPage(session.user.id as string, {
        page: Number.isInteger(page) && page > 0 ? page : 1,
    });

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Bookings</h1>
            </header>

            <BookingsClient
                activeBooking={result.activeBooking}
                inactiveBookings={result.inactiveBookings}
                pagination={result.pagination}
            />
        </main>
    );
}

