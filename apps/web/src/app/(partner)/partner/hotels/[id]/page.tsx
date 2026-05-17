import {
  BanknotesIcon,
  BuildingOffice2Icon,
  PencilSquareIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import { getPartnerHotelDetails } from "@/server/services/partnerHotels";
import type { PartnerHotelPageProps } from "@/types/partner";
import type { PartnerPaymentMethod } from "@/types/partner-hotel";

function parseHotelId(value: string): number {
  const hotelId = Number(value);
  if (!Number.isInteger(hotelId) || hotelId < 1) notFound();
  return hotelId;
}

function formatPaymentMethod(method: PartnerPaymentMethod): string {
  if (method === "stripe") return "Card via Stripe";
  return "Cash on arrival";
}

export default async function Page({ params }: PartnerHotelPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const { id } = await params;
  const hotelId = parseHotelId(id);
  const hotel = await getPartnerHotelDetails(auth.userId, hotelId);
  if (!hotel) notFound();

  return (
    <>
      <PartnerPageHeader
        eyebrow="Hotel details"
        title={hotel.name}
        description={`${hotel.location}. Live operational detail page for partner hotel management.`}
        actions={
          <>
            <Link
              href={`/partner/hotels/${hotel.id}/rooms`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
              Rooms
            </Link>
            <Link
              href={`/partner/hotels/${hotel.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              Edit hotel
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {["Overview", "Rooms", "Payments", "Photos"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            {item}
          </a>
        ))}
      </div>

      <section id="overview" className="grid gap-5 lg:grid-cols-4">
        <PartnerCard>
          <p className="text-sm text-slate-400">Status</p>
          <div className="mt-3">
            <PartnerBadge tone="emerald">Active</PartnerBadge>
          </div>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Room types</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.roomTypeCount}</p>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Hotel photos</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.images.length}</p>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Payment methods</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.paymentMethods.length}</p>
        </PartnerCard>
      </section>

      <PartnerSection
        title="Hotel information"
        description="Guest-facing name, location, and description from the database."
      >
        <PartnerCard>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Location</p>
              <p className="mt-2 font-semibold text-white">{hotel.location}</p>
              <p className="mt-5 text-sm leading-6 text-slate-300">
                {hotel.description ?? "No description has been added yet."}
              </p>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              {hotel.coverImageUrl ? (
                <Image
                  src={hotel.coverImageUrl}
                  alt={`${hotel.name} cover image`}
                  width={520}
                  height={390}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <PhotoIcon className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </PartnerCard>
      </PartnerSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PartnerSection
          title="Rooms"
          description="Room type summary for this hotel."
          className="scroll-mt-24"
        >
          <div id="rooms" className="grid gap-4">
            {hotel.rooms.length > 0 ? hotel.rooms.map((room) => (
              <PartnerCard key={room.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{room.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Capacity {room.capacity} - ${room.pricePerNight}/night - {room.totalRooms} total rooms
                    </p>
                  </div>
                  <PartnerBadge tone="emerald">{room.images.length} photos</PartnerBadge>
                </div>
              </PartnerCard>
            )) : (
              <PartnerCard>
                <p className="text-sm text-slate-400">No room types have been added yet.</p>
              </PartnerCard>
            )}
          </div>
        </PartnerSection>

        <PartnerSection
          title="Payments"
          description="Booking payment methods configured for this hotel."
          className="scroll-mt-24"
        >
          <div id="payments" className="grid gap-4">
            {hotel.paymentMethods.length > 0 ? hotel.paymentMethods.map((method) => (
              <PartnerCard key={method}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-white">{formatPaymentMethod(method)}</span>
                  <BanknotesIcon className="h-5 w-5 text-amber-200" aria-hidden="true" />
                </div>
              </PartnerCard>
            )) : (
              <PartnerCard>
                <p className="text-sm text-slate-400">No payment methods have been configured.</p>
              </PartnerCard>
            )}
          </div>
        </PartnerSection>
      </div>

      <section id="photos" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Photos</h2>
          <p className="mt-1 text-sm text-slate-400">General hotel image gallery.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {hotel.images.length > 0 ? hotel.images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
            >
              <Image
                src={image.imageUrl}
                alt={`${hotel.name} image`}
                width={520}
                height={390}
                className="h-full w-full object-cover"
              />
              {image.isCover ? (
                <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-950">
                  Cover
                </span>
              ) : null}
            </div>
          )) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-slate-400">
              <PhotoIcon className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
