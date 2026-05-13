"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingDetails } from "@/types/hotel-panel";
import { AppButton } from "@/components/AppButton";

export default function ReservationFormClient({ listing }: { listing: ListingDetails }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);

  const handleConfirm = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    router.push(`/listings/${listing.id}/reserve/confirm?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-4">Reserve {listing.name}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Check-in</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-2 rounded-md border p-2"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Check-out</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-2 rounded-md border p-2"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium text-slate-700">Guests</span>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-20 rounded-md border p-2"
        />
      </label>

      <div className="flex gap-3">
        <AppButton variant="primary" size="md" onClick={handleConfirm}>
          Confirm Reservation
        </AppButton>

        <AppButton variant="ghost" size="md" onClick={() => router.push(`/listings/${listing.id}`)}>
          Back
        </AppButton>
      </div>
    </div>
  );
}
