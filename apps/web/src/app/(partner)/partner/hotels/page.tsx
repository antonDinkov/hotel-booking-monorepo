import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerEmptyState from "@/components/partner/PartnerEmptyState";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { listPartnerHotels } from "@/server/services/partnerHotels";

const addHotelButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200";

async function getPartnerUserId(): Promise<string> {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");
  return auth.userId;
}

export default async function Page() {
  const userId = await getPartnerUserId();
  const hotels = await listPartnerHotels(userId);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Listing portfolio"
        title="Hotels"
        description="Portfolio-level hotel management for status, room inventory, and common partner actions."
        actions={
          <Link href="/partner/hotels/add" className={addHotelButtonClass}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add hotel
          </Link>
        }
      />

      {hotels.length > 0 ? (
        <div className="grid gap-5">
          {hotels.map((hotel) => (
            <PartnerCard key={hotel.id}>
              <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-start">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                  {hotel.coverImageUrl ? (
                    <Image
                      src={hotel.coverImageUrl}
                      alt={`${hotel.name} cover image`}
                      width={360}
                      height={270}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No cover
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">{hotel.name}</h2>
                    <PartnerBadge tone="emerald">Active</PartnerBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{hotel.location}</p>
                  {hotel.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                      {hotel.description}
                    </p>
                  ) : null}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Room types</p>
                      <p className="mt-1 font-semibold text-white">{hotel.roomTypeCount}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Location</p>
                      <p className="mt-1 font-semibold text-white">{hotel.location}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cover</p>
                      <p className="mt-1 font-semibold text-white">
                        {hotel.coverImageUrl ? "Ready" : "Missing"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:w-[330px]">
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
                </div>
              </div>
            </PartnerCard>
          ))}
        </div>
      ) : (
        <PartnerEmptyState
          title="No hotels yet"
          description="Create your first partner hotel and attach general images, rooms, and payment methods."
          action={
            <Link href="/partner/hotels/add" className={addHotelButtonClass}>
              Add hotel
            </Link>
          }
        />
      )}

      <Link
        href="/partner/hotels/add"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300/30 bg-amber-300/10 px-4 py-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
        Add another hotel
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </>
  );
}
