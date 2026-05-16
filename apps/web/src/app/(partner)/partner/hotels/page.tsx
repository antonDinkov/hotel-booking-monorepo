import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { partnerHotels } from "@/lib/partner-mock-data";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import type { PartnerBadgeTone } from "@/types/partner";

function hotelTone(status: string): PartnerBadgeTone {
  if (status === "Active") return "emerald";
  if (status === "Draft") return "amber";
  return "slate";
}

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Listing portfolio"
        title="Hotels"
        description="A visual-only listing management surface for hotel status, performance, and common partner actions."
        actions={
          <Link
            href="/partner/hotels/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add hotel
          </Link>
        }
      />

      <div className="grid gap-5">
        {partnerHotels.map((hotel) => (
          <PartnerCard key={hotel.id}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{hotel.name}</h2>
                  <PartnerBadge tone={hotelTone(hotel.status)}>{hotel.status}</PartnerBadge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {hotel.address}, {hotel.city}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rooms</p>
                    <p className="mt-1 font-semibold text-white">{hotel.rooms}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rating</p>
                    <p className="mt-1 font-semibold text-white">{hotel.rating}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Occupancy</p>
                    <p className="mt-1 font-semibold text-white">{hotel.occupancy}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Revenue</p>
                    <p className="mt-1 font-semibold text-white">{hotel.revenue}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 lg:w-[440px]">
                <Link
                  href={`/partner/hotels/${hotel.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  View
                </Link>
                <Link
                  href={`/partner/hotels/${hotel.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
                <Link
                  href={`/partner/hotels/${hotel.id}/rooms`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
                  Rooms
                </Link>
                <Link
                  href="/partner/reviews"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                  Reviews
                </Link>
              </div>
            </div>
          </PartnerCard>
        ))}
      </div>

      <Link
        href="/partner/hotels/new"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300/30 bg-amber-300/10 px-4 py-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
        Add another hotel
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </>
  );
}
