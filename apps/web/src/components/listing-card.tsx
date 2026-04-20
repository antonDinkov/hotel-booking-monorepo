import Link from "next/link";
import Image from "next/image";
import type { Listing } from "../types/hotel-panel";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${filled ? "text-amber-400" : "text-amber-200"}`} fill="currentColor">
      <path d="m12 2.4 3 6.1 6.7 1-4.9 4.8 1.1 6.7-5.9-3.1-5.9 3.1 1.1-6.7-4.9-4.8 6.7-1L12 2.4Z" />
    </svg>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-slate-900">{value.toFixed(1)}</span>
      <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon key={index} filled={index < Math.floor(value)} />
        ))}
      </div>
    </div>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] cursor-pointer">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={listing.image.src}
            alt={listing.image.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
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