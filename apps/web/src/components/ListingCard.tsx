"use client";

import Link from "next/link";
import type { Listing } from "../types/hotel-panel";
import HotelImage from "./Hotelimage";
import { StarIcon as SolidStar } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStar } from "@heroicons/react/24/outline";

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-slate-900">{value.toFixed(1)}</span>
      <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) =>
          index < Math.floor(value) ? (
            <SolidStar key={index} className="h-4 w-4 text-amber-400" />
          ) : (
            <OutlineStar key={index} className="h-4 w-4 text-amber-200" />
          )
        )}
      </div>
    </div>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] cursor-pointer">
        <div className="relative h-56 overflow-hidden">
          <HotelImage images={[listing.image.src]} alt={listing.image.alt} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
        </div>

        <div className="p-5">
          <p className="text-lg font-semibold leading-snug text-blue-950">{listing.name}</p>
          <p className="mt-1 text-sm text-slate-500">{listing.category}</p>

          <div className="mt-4 flex items-center justify-between gap-4">
            <Rating value={listing.rating} />
            <span className="text-sm text-slate-500">{listing.reviewLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
