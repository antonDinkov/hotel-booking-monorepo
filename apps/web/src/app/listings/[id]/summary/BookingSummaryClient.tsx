"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { AppButton } from "@/components/AppButton";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import type { ListingDetails } from "@/types/hotel-panel";

interface BookingSummaryClientProps {
  listing: ListingDetails;
  checkInDate: string;
  checkOutDate: string;
  guests: string;
  roomTypeId: string;
  rooms: string;
  roomPrice: number;
}

export default function BookingSummaryClient({
  listing,
  checkInDate,
  checkOutDate,
  guests,
  roomTypeId,
  rooms,
  roomPrice,
}: BookingSummaryClientProps) {
  const router = useRouter();

  // Calculate number of nights
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate total price
  const roomsCount = Number.parseInt(rooms, 10) || 1;
  const pricePerNight = roomPrice;
  const totalPrice = pricePerNight * nights * roomsCount;

  const handleConfirm = () => {
    // For now, redirect to dashboard; in production, create booking here
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="mb-6">
        <AppButton
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="justify-start px-0 py-0 hover:-translate-x-0.5 hover:-translate-y-0"
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          Back
        </AppButton>
      </div>

      {/* Summary Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Booking Details */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <h1 className="mb-8 text-3xl font-bold text-slate-950">Booking Summary</h1>

            {/* Property Details */}
            <div className="mb-8 border-b border-slate-200 pb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Property</h2>
              <div className="flex gap-4">
                {listing.images?.[0] && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                    <Image
                      src={listing.images[0].src}
                      alt={listing.images[0].alt}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-2xl font-bold text-slate-950">{listing.name}</p>
                  <p className="mt-1 text-slate-600">{listing.location}</p>
                  <p className="mt-2 text-sm text-slate-500">{listing.category}</p>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="mb-8 border-b border-slate-200 pb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Your Stay</h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-600">Check-in</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {new Date(checkInDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Check-out</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {new Date(checkOutDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Duration</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {nights} night{nights === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            {/* Guests and Rooms */}
            <div className="mb-8 border-b border-slate-200 pb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Guests & Rooms</h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-600">Guests</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{guests}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Room Type ID</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{roomTypeId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Number of Rooms</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{roomsCount}</p>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Price Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    ${pricePerNight} × {nights} night{nights === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${pricePerNight * nights}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">× {roomsCount} room{roomsCount === 1 ? "" : "s"}</span>
                  <span className="font-semibold text-slate-900">{roomsCount}×</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total Price</span>
                    <span className="text-2xl font-bold text-blue-600">${totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Confirmation Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg sticky top-24">
            <div className="mb-6">
              <p className="text-sm text-slate-600">Total Price</p>
              <p className="mt-2 text-4xl font-bold text-slate-950">${totalPrice}</p>
              <p className="mt-1 text-xs text-slate-500">
                for {nights} night{nights === 1 ? "" : "s"}
              </p>
            </div>

            <AppButton
              variant="primary"
              size="lg"
              className="mb-3 w-full shadow-blue-700/25"
              onClick={handleConfirm}
            >
              Confirm Booking
            </AppButton>

            <AppButton variant="secondary" size="lg" className="w-full" onClick={() => router.back()}>
              Change Selection
            </AppButton>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3">✓ Free cancellation before check-in</p>
              <p className="text-sm text-slate-600 mb-3">✓ 24/7 customer support</p>
              <p className="text-sm text-slate-600">✓ Secure payment guaranteed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
