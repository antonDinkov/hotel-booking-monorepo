"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AppButton } from "./AppButton";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { StarIcon as SolidStar } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStar } from "@heroicons/react/24/outline";
import { createPendingBookingHoldRequest } from "@/lib/booking-client";
import type { ListingDetails } from "../types/hotel-panel";
import type { RoomAvailability } from "@/types/room-availability";
import { RoomAvailabilityTable } from "./RoomAvailabilityTable";
import ShiningStarBadge from "./ShiningStarBadge";
import { FavoriteHeartButton } from "./FavoriteHeartButton";

interface ListingDetailsCardProps {
  listing: ListingDetails;
  availability: RoomAvailability[];
  guestsCount: number;
  checkInDate: string;
  checkOutDate: string;
  hasSearchDates?: boolean;
  initialIsFavorite?: boolean;
  canFavorite?: boolean;
}

function getNights(checkInDate: string, checkOutDate: string) {
  return Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
}

function getRequiredRooms(room: RoomAvailability, guestsCount: number): number {
  return room.requiredRooms ?? Math.ceil(guestsCount / Math.max(1, room.capacity));
}

function getDefaultRoomCount(room: RoomAvailability, guestsCount: number): number {
  return Math.min(room.availableRooms, Math.max(1, getRequiredRooms(room, guestsCount)));
}

function RatingDisplay({ rating, label }: { rating: number | null; label?: string }) {
  if (rating === null) {
    return <span className="text-2xl font-bold text-blue-700">{label ?? "New"}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-slate-950">{label ?? rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => (
          index < Math.floor(rating)
            ? <SolidStar key={index} className="h-5 w-5 text-amber-400" />
            : <OutlineStar key={index} className="h-5 w-5 text-amber-200" />
        ))}
      </div>
    </div>
  );
}

export function ListingDetailsCard({
  listing,
  availability,
  guestsCount,
  checkInDate,
  checkOutDate,
  hasSearchDates = true,
  initialIsFavorite = false,
  canFavorite = false,
}: ListingDetailsCardProps) {
  const router = useRouter();

  const defaultRoomTypeId = useMemo(() => {
    if (availability.length === 0) return null;
    const sorted = [...availability].sort(
      (a, b) => getRequiredRooms(a, guestsCount) - getRequiredRooms(b, guestsCount) || a.capacity - b.capacity
    );
    const exact = sorted.find((room) => room.capacity * getRequiredRooms(room, guestsCount) === guestsCount);
    return (exact ?? sorted[0]).roomTypeId;
  }, [availability, guestsCount]);

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(defaultRoomTypeId);
  const [roomCounts, setRoomCounts] = useState<Record<number, number>>({});
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (!defaultRoomTypeId) {
      setSelectedRoomTypeId(null);
      setRoomCounts({});
      return;
    }

    setSelectedRoomTypeId(defaultRoomTypeId);
    setRoomCounts((prev) => {
      const next: Record<number, number> = {};
      availability.forEach((room) => {
        next[room.roomTypeId] = 0;
      });
      const current = prev[defaultRoomTypeId] ?? 0;
      const defaultRoom = availability.find((room) => room.roomTypeId === defaultRoomTypeId);
      next[defaultRoomTypeId] = defaultRoom
        ? Math.min(defaultRoom.availableRooms, Math.max(current, getDefaultRoomCount(defaultRoom, guestsCount)))
        : Math.max(current, 1);
      return next;
    });
  }, [availability, defaultRoomTypeId, guestsCount]);

  const handleSelectRoomType = (roomTypeId: number) => {
    setSelectedRoomTypeId(roomTypeId);
    setRoomCounts((prev) => {
      const next: Record<number, number> = { ...prev };
      availability.forEach((room) => {
        next[room.roomTypeId] = 0;
      });
      const selected = availability.find((room) => room.roomTypeId === roomTypeId);
      next[roomTypeId] = selected ? getDefaultRoomCount(selected, guestsCount) : 1;
      return next;
    });
  };

  const handleRoomCountChange = (roomTypeId: number, count: number) => {
    if (roomTypeId !== selectedRoomTypeId) return;
    setRoomCounts((prev) => ({
      ...prev,
      [roomTypeId]: count,
    }));
  };

  const selectedRoom = availability.find((room) => room.roomTypeId === selectedRoomTypeId) ?? null;
  const selectedRooms = selectedRoomTypeId ? roomCounts[selectedRoomTypeId] ?? 0 : 0;
  const selectedRequiredRooms = selectedRoom ? getRequiredRooms(selectedRoom, guestsCount) : 1;
  const hasEnoughSelectedRooms = Boolean(selectedRoom && selectedRooms >= selectedRequiredRooms);
  const totalPerNight = selectedRoom ? selectedRoom.pricePerNight * selectedRooms : 0;

  const nights = getNights(checkInDate, checkOutDate);
  const totalPrice = totalPerNight * nights;

  const handleReserve = async () => {
    if (!selectedRoomTypeId || !hasEnoughSelectedRooms || !hasSearchDates || !selectedRoom) return;

    setIsReserving(true);
    setReserveError(null);

    try {
      const hold = await createPendingBookingHoldRequest({
        hotelId: Number(listing.id),
        roomTypeId: selectedRoomTypeId,
        checkInDate,
        checkOutDate,
        guestsCount,
        roomsCount: selectedRooms,
      });

      router.push(`/listings/${listing.id}/summary?bookingId=${hold.bookingId}`);
    } catch (error) {
      setReserveError(error instanceof Error ? error.message : "Failed to reserve this room.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleChooseDate = () => {
    if (!selectedRoomTypeId || !selectedRoom) return;
    const params = new URLSearchParams({
      roomTypeId: String(selectedRoomTypeId),
      roomPrice: String(selectedRoom.pricePerNight),
      rooms: String(selectedRooms || selectedRequiredRooms),
      guests: String(guestsCount),
      roomCapacity: String(selectedRoom.capacity),
    });
    router.push(`/listings/${listing.id}/pick-dates?${params.toString()}`);
  };

  const isImmediateReserve = hasSearchDates;
  const primaryActionLabel = isImmediateReserve ? "Reserve" : "Choose Dates";
  const primaryAction = isImmediateReserve ? handleReserve : handleChooseDate;
  const totalLabel = hasSearchDates ? "Total Price" : "Total Price";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <AppButton
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-6 justify-start px-0 py-0 hover:-translate-x-0.5 hover:-translate-y-0"
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
        >
          Back
        </AppButton>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-2 h-96 lg:h-[32rem] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {listing.images.map((img, index) => (
          <div
            key={index}
            className={`relative ${
              index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
            } overflow-hidden rounded-lg`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={
                index === 0
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 50vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
              loading={index === 0 ? "eager" : "lazy"}
              className="object-cover hover:scale-105 transition duration-300"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  {listing.category}
                </p>
                <FavoriteHeartButton
                  hotelId={listing.id}
                  initialIsFavorite={initialIsFavorite}
                  isAuthenticated={canFavorite}
                  size="lg"
                  variant="inline"
                />
              </div>
              <h1 className="text-4xl font-bold text-slate-950 mb-2">
                {listing.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <RatingDisplay rating={listing.rating} label={listing.ratingLabel} />
                <ShiningStarBadge badge={listing.trustBadge} />
                <span className="text-slate-600">{listing.reviewLabel}</span>
                <Link
                  href={`/listings/${listing.id}/reviews`}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Reviews
                </Link>
              </div>
            </div>

            {/* Location */}
            <div className="mb-8 pb-8 border-b border-slate-200">
              <p className="flex items-start gap-2 text-slate-700">
                <span className="text-xl">📍</span>
                <span>{listing.location}</span>
              </p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950 mb-4">
                About this property
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <RoomAvailabilityTable
              availability={availability}
              guestsCount={guestsCount}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              selectedRoomTypeId={selectedRoomTypeId}
              roomCounts={roomCounts}
              onSelectRoomType={handleSelectRoomType}
              onRoomCountChange={handleRoomCountChange}
            />

            {/* Property Details */}

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {listing.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-white p-4 border border-slate-200"
                  >
                    <span className="text-2xl">{amenity.icon}</span>
                    <span className="font-semibold text-slate-700">
                      {amenity.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="text-2xl font-bold text-slate-950 mb-4">
                Highlights
              </h2>
              <ul className="space-y-3">
                {listing.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-slate-700"
                  >
                    <span className="flex-shrink-0 rounded-full bg-blue-500 w-2 h-2" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-1">{totalLabel}</p>
                <p className="text-3xl font-bold text-slate-950">${totalPrice}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {nights} night{nights === 1 ? "" : "s"} × {selectedRooms || 1} room{(selectedRooms || 1) === 1 ? "" : "s"}
                </p>
              </div>

              {reserveError && (
                <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {reserveError}
                </p>
              )}

              <AppButton
                variant="primary"
                size="lg"
                className="mb-3 w-full shadow-blue-700/25"
                onClick={primaryAction}
                disabled={!selectedRoomTypeId || !hasEnoughSelectedRooms || isReserving}
              >
                {isReserving ? "Reserving..." : primaryActionLabel}
              </AppButton>

              <AppButton variant="secondary" size="lg" className="w-full">
                Contact partner
              </AppButton>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-3">
                  ✓ Free cancellation before check-in
                </p>
                <p className="text-sm text-slate-600 mb-3">
                  ✓ 24/7 customer support
                </p>
                <p className="text-sm text-slate-600">
                  ✓ Secure payment guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
