export default function BookingsPage() {
    // Placeholder data structure for bookings
    const bookings = [
        {
            id: "placeholder-booking-id-1",
            hotelName: "Placeholder Hotel Name",
            checkIn: "2024-01-01",
            checkOut: "2024-01-05",
            status: "confirmed",
            totalPrice: 500,
            roomType: "Deluxe Room"
        },
        {
            id: "placeholder-booking-id-2",
            hotelName: "Another Placeholder Hotel",
            checkIn: "2024-02-01",
            checkOut: "2024-02-03",
            status: "pending",
            totalPrice: 300,
            roomType: "Standard Room"
        }
    ];

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Bookings</h1>
            </header>

            <div className="space-y-6">
                {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">{booking.hotelName}</h3>
                                <p className="text-sm text-slate-600">{booking.roomType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900">${booking.totalPrice}</p>
                                <p className="text-xs text-slate-500">{booking.status}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-slate-600">
                                Check-in: {booking.checkIn} | Check-out: {booking.checkOut}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
