"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingStayFields } from "@/components/BookingStayFields";
import { AppButton } from "@/components/AppButton";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import type { ListingDetails } from "@/types/hotel-panel";

interface PickDatesClientProps {
    listing: ListingDetails;
    roomTypeId: string;
    roomPrice: number;
    rooms: number;
    guests: string;
    roomCapacity: number;
}

export default function PickDatesClient({ listing, roomTypeId, roomPrice, rooms, guests, roomCapacity }: PickDatesClientProps) {
    const router = useRouter();
    const [checkIn, setCheckIn] = useState<string>("");
    const [checkOut, setCheckOut] = useState<string>("");
    const maxGuests = Math.max(1, roomCapacity * rooms);
    const [currentGuests, setCurrentGuests] = useState<string>(() => {
        const preferred = Number.parseInt(guests, 10) || 1;
        return String(Math.min(preferred, maxGuests));
    });
    const [error, setError] = useState<string>("");
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [showNoAvailabilityModal, setShowNoAvailabilityModal] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Countdown effect for redirect
    useEffect(() => {
        if (!showNoAvailabilityModal) return;

        if (countdown <= 0) {
            router.push("/dashboard");
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, showNoAvailabilityModal, router]);

    const handleContinue = async () => {
        setError("");

        if (!checkIn || !checkOut) {
            setError("Please select both check-in and check-out dates");
            return;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
            setError("Check-out date must be after check-in date");
            return;
        }

        // Check availability before proceeding
        setIsCheckingAvailability(true);

        try {
            const params = new URLSearchParams({
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guests: currentGuests,
            });

            const response = await fetch(
                `/api/hotels/${listing.id}/availability?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error("Failed to check availability");
            }

            const result = await response.json();

            if (!result.data.hasAvailability) {
                setCountdown(5);
                setShowNoAvailabilityModal(true);
                setIsCheckingAvailability(false);
                return;
            }
        } catch (err) {
            console.error("Availability check error:", err);
            setError("Unable to check availability. Please try again.");
            setIsCheckingAvailability(false);
            return;
        }

        // If availability check passed, navigate to summary
        const params = new URLSearchParams({
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guests: currentGuests,
            roomTypeId,
            roomPrice: String(roomPrice),
            rooms: String(rooms),
        });

        router.push(`/listings/${listing.id}/summary?${params.toString()}`);
        setIsCheckingAvailability(false);
    };

    const nights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 1;
    const totalPrice = roomPrice * rooms * nights;

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

            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow">
                    <h1 className="mb-2 text-3xl font-bold text-slate-950">Choose Your Dates</h1>
                    <p className="mb-6 text-slate-600">{listing.name}</p>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {isCheckingAvailability && (
                        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-700">
                            <p className="font-medium">Checking availability...</p>
                        </div>
                    )}

                    <BookingStayFields
                        checkIn={checkIn}
                        checkOut={checkOut}
                        guests={currentGuests}
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                        onGuestsChange={setCurrentGuests}
                        guestInputVariant="select"
                        maxGuests={Math.max(1, roomCapacity * rooms)}
                        className="mb-6 space-y-6"
                    />

                    <div className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-950">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Room</p>
                                <p className="mt-1 text-sm font-semibold">{roomTypeId || "Selected room"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Rooms</p>
                                <p className="mt-1 text-sm font-semibold">{rooms}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Guests</p>
                                <p className="mt-1 text-sm font-semibold">{currentGuests}</p>
                            </div>
                        </div>

                        <div className="mt-4 border-t border-blue-200 pt-4">
                            <p className="text-sm text-blue-900">
                                {nights} night{nights === 1 ? "" : "s"} x {rooms} room{rooms === 1 ? "" : "s"} x ${roomPrice} per night
                            </p>
                            <p className="mt-1 text-2xl font-bold text-blue-950">${totalPrice}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-3">
                        <AppButton
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            onClick={handleContinue}
                            disabled={isCheckingAvailability}
                        >
                            Reserve
                        </AppButton>
                        <AppButton
                            variant="ghost"
                            size="lg"
                            className="flex-1"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </AppButton>
                    </div>
                </div>
            </div>

            {/* No Availability Modal */}
            {showNoAvailabilityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">No availability</p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-950">No rooms available for these dates.</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            You will be redirected to your dashboard in <span className="font-semibold text-slate-950">{countdown}</span> second{countdown === 1 ? "" : "s"}. Press OK to go there now.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
