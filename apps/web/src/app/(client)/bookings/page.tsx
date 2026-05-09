import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { BookingsClient } from "./BookingsClient";
import { getBookings } from "@/server/services/bookings";
import type { MyBooking } from "@/types/booking";

export default async function BookingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const bookings = await getBookings(session.user.id as string);

    const activeBooking = bookings.find((b) => b.status === "active") ?? null;
    const inactiveBookings = bookings.filter((b) => b.status !== "active");

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Bookings</h1>
            </header>

            <BookingsClient activeBooking={activeBooking} inactiveBookings={inactiveBookings} />
        </main>
    );
}

