"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingDetails } from "@/types/hotel-panel";
import { AppButton } from "@/components/AppButton";
import { BookingStayFields } from "@/components/BookingStayFields";

export default function ReservationFormClient({ listing }: { listing: ListingDetails }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<string>("2");

  const handleConfirm = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests);
    router.push(`/listings/${listing.id}/reserve/confirm?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-4">Reserve {listing.name}</h1>

      <div className="mb-6">
        <BookingStayFields
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onGuestsChange={setGuests}
          guestInputVariant="number"
        />
      </div>

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
