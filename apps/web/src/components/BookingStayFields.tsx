"use client";

import type { BookingStayFieldsProps } from "@/types/booking-stay-fields";

function getGuestOptions(maxGuests: number) {
    return Array.from({ length: maxGuests }, (_, index) => String(index + 1));
}

export function BookingStayFields({
    checkIn,
    checkOut,
    guests,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
    guestInputVariant = "select",
    maxGuests = 8,
    className = "space-y-6",
}: BookingStayFieldsProps) {
    const guestOptions = getGuestOptions(maxGuests);
    console.log("This is the max guest number: " ,maxGuests);
    
    return (
        <div className={className}>
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Check-in Date</label>
                <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => onCheckInChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Check-out Date</label>
                <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => onCheckOutChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Number of Guests</label>
                {guestInputVariant === "number" ? (
                    <input
                        type="number"
                        min={1}
                        max={maxGuests}
                        value={guests}
                        onChange={(e) => onGuestsChange(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                ) : (
                    <select
                        value={guests}
                        onChange={(e) => onGuestsChange(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {guestOptions.map((num) => (
                            <option key={num} value={num}>
                                {num} guest{num === "1" ? "" : "s"}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}