import {
  BanknotesIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import { partnerBookings } from "@/lib/partner-mock-data";
import type { PartnerBadgeTone, PartnerBookingPageProps } from "@/types/partner";

function statusTone(status: string): PartnerBadgeTone {
  if (status === "Upcoming") return "emerald";
  if (status === "Cancelled") return "rose";
  return "slate";
}

export default async function Page({ params }: PartnerBookingPageProps) {
  const { id } = await params;
  const booking = partnerBookings.find((item) => item.id === id) ?? partnerBookings[0];

  return (
    <>
      <PartnerPageHeader
        eyebrow="Booking details"
        title={`${booking.guest} - ${booking.id}`}
        description="A static booking operations page for guest, payment, stay details, notes, and visual actions."
        actions={
          <Link
            href="/partner/bookings"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
          >
            Back to bookings
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PartnerSection title="Guest info">
            <PartnerCard>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex gap-3">
                  <UserIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Guest</p>
                    <p className="mt-1 font-semibold text-white">{booking.guest}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <EnvelopeIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="mt-1 font-semibold text-white">{booking.guestEmail}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PhoneIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Phone</p>
                    <p className="mt-1 font-semibold text-white">{booking.guestPhone}</p>
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Stay details">
            <PartnerCard>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Hotel</p>
                  <p className="mt-1 font-semibold text-white">{booking.hotel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Room</p>
                  <p className="mt-1 font-semibold text-white">{booking.room}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Dates</p>
                  <p className="mt-1 font-semibold text-white">{booking.dates}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Check-in time</p>
                  <p className="mt-1 font-semibold text-white">{booking.checkInTime}</p>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Notes">
            <PartnerCard>
              <p className="text-sm leading-6 text-slate-300">{booking.notes}</p>
            </PartnerCard>
          </PartnerSection>
        </div>

        <div className="space-y-6">
          <PartnerSection title="Payment info">
            <PartnerCard>
              <div className="flex items-start gap-3">
                <BanknotesIcon className="mt-1 h-5 w-5 text-emerald-200" aria-hidden="true" />
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{booking.total}</p>
                  <div className="mt-3">
                    <PartnerBadge tone={statusTone(booking.status)}>
                      {booking.status}
                    </PartnerBadge>
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Actions">
            <div className="grid gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                Mark check-in reviewed
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
              >
                Message guest
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-rose-300/20 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/10"
              >
                Flag for review
              </button>
            </div>
          </PartnerSection>
        </div>
      </div>
    </>
  );
}
