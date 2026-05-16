import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerChartPlaceholder from "@/components/partner/PartnerChartPlaceholder";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import {
  partnerBookings,
  partnerHotels,
  partnerReviews,
  partnerRooms,
} from "@/lib/partner-mock-data";
import type { PartnerBadgeTone, PartnerHotelPageProps } from "@/types/partner";

function statusTone(status: string): PartnerBadgeTone {
  if (status === "Active" || status === "Available") return "emerald";
  if (status === "Draft" || status === "Limited") return "amber";
  return "slate";
}

export default async function Page({ params }: PartnerHotelPageProps) {
  const { id } = await params;
  const hotel = partnerHotels.find((item) => item.id === id) ?? partnerHotels[0];
  const rooms = partnerRooms.filter((room) => room.hotelId === hotel.id);
  const bookings = partnerBookings.filter((booking) => booking.hotelId === hotel.id);
  const reviews = partnerReviews.filter((review) => review.hotel === hotel.name);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Hotel details"
        title={hotel.name}
        description={`${hotel.address}, ${hotel.city}. Visual-only operational detail page for partner managers.`}
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
              Edit hotel
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {["Overview", "Rooms", "Bookings", "Reviews", "Pricing", "Photos"].map(
          (item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              {item}
            </a>
          )
        )}
      </div>

      <section id="overview" className="grid gap-5 lg:grid-cols-4">
        <PartnerCard>
          <p className="text-sm text-slate-400">Status</p>
          <div className="mt-3">
            <PartnerBadge tone={statusTone(hotel.status)}>{hotel.status}</PartnerBadge>
          </div>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Average rating</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.rating}</p>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Occupancy</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.occupancy}</p>
        </PartnerCard>
        <PartnerCard>
          <p className="text-sm text-slate-400">Revenue</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotel.revenue}</p>
        </PartnerCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PartnerSection
          title="Rooms"
          description="Room inventory connected to this static hotel preview."
          className="scroll-mt-24"
        >
          <div id="rooms" className="grid gap-4">
            {rooms.map((room) => (
              <PartnerCard key={room.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{room.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {room.type} - {room.capacity} - {room.rate}/night
                    </p>
                  </div>
                  <PartnerBadge tone={statusTone(room.status)}>{room.status}</PartnerBadge>
                </div>
              </PartnerCard>
            ))}
          </div>
        </PartnerSection>

        <PartnerSection
          title="Pricing"
          description="Static visual trend for nightly revenue."
          className="scroll-mt-24"
        >
          <div id="pricing">
            <PartnerChartPlaceholder
              title="Average daily rate"
              value="$214"
              caption="last 7-day preview"
              bars={[48, 55, 62, 76, 71, 86, 82]}
            />
          </div>
        </PartnerSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PartnerSection
          title="Bookings"
          description="Recent stays tied to this hotel."
          className="scroll-mt-24"
        >
          <div id="bookings" className="grid gap-4">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/partner/bookings/${booking.id}`}>
                <PartnerCard className="transition hover:border-amber-300/30 hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{booking.guest}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {booking.room} - {booking.dates}
                      </p>
                    </div>
                    <PartnerBadge tone={booking.status === "Cancelled" ? "rose" : "emerald"}>
                      {booking.status}
                    </PartnerBadge>
                  </div>
                </PartnerCard>
              </Link>
            ))}
          </div>
        </PartnerSection>

        <PartnerSection
          title="Reviews"
          description="Guest feedback for the selected hotel."
          className="scroll-mt-24"
        >
          <div id="reviews" className="grid gap-4">
            {reviews.map((review) => (
              <PartnerCard key={review.id}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-white">{review.guest}</h3>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    <StarIcon className="h-4 w-4" aria-hidden="true" />
                    {review.rating}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
              </PartnerCard>
            ))}
          </div>
        </PartnerSection>
      </div>

      <section id="photos" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Photos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Placeholder media grid for the hotel gallery.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              Preview
            </span>
            <span className="inline-flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
              Guest-facing
            </span>
            <span className="inline-flex items-center gap-1">
              <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
              No upload
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-slate-400"
            >
              <PhotoIcon className="h-8 w-8" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
