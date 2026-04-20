"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { AppButton } from "./app-button";
import type { ListingDetails } from "../types/hotel-panel";

export function ListingDetailsCard({ listing }: { listing: ListingDetails }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <AppButton
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-6 justify-start px-0 py-0 hover:-translate-x-0.5 hover:-translate-y-0"
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
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
              <p className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-4">
                {listing.category}
              </p>
              <h1 className="text-4xl font-bold text-slate-950 mb-2">
                {listing.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-950">
                    {listing.rating}
                  </span>
                  <span className="text-yellow-400">★★★★★</span>
                </div>
                <span className="text-slate-600">
                  {listing.reviewLabel}
                </span>
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

            {/* Property Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950 mb-4">
                Property Details
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Bedrooms</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {listing.bedrooms}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Bathrooms</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {listing.bathrooms}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Guests</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {listing.guests}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Rating</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {listing.rating}
                  </p>
                </div>
              </div>
            </div>

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
                <p className="text-sm text-slate-600 mb-1">Price per night</p>
                <p className="text-3xl font-bold text-slate-950">
                  ${listing.price}
                </p>
              </div>

              <AppButton variant="primary" size="lg" className="mb-3 w-full shadow-blue-700/25">
                Reserve
              </AppButton>

              <AppButton variant="secondary" size="lg" className="w-full">
                Contact Host
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
