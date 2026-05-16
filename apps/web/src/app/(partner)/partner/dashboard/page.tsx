import {
  ArrowRightIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  partnerBookings,
  partnerQuickActions,
  partnerReviews,
  partnerStats,
} from "@/lib/partner-mock-data";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerChartPlaceholder from "@/components/partner/PartnerChartPlaceholder";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import PartnerStatCard from "@/components/partner/PartnerStatCard";
import type { PartnerBadgeTone } from "@/types/partner";

const statIcons = [
  ClipboardDocumentListIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  StarIcon,
  ClockIcon,
];

function bookingTone(status: string): PartnerBadgeTone {
  if (status === "Upcoming") return "emerald";
  if (status === "Cancelled") return "rose";
  return "slate";
}

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Portfolio command center"
        title="Partner dashboard"
        description="Portfolio view for bookings, revenue, guest feedback, occupancy, and daily operating actions across owned hotels."
        actions={
          <>
            <Link
              href="/partner/calendar"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
              Calendar
            </Link>
            <Link
              href="/partner/hotels/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              Add hotel
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {partnerStats.map((stat, index) => {
          const Icon = statIcons[index];

          return (
            <PartnerStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
              trend={stat.trend}
              tone={stat.tone}
              icon={<Icon className="h-5 w-5" aria-hidden="true" />}
            />
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <PartnerSection
          title="Recent bookings"
          description="Latest reservations across the partner portfolio."
          actions={
            <Link
              href="/partner/bookings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <PartnerCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Guest</th>
                    <th className="px-4 py-3 font-semibold">Hotel</th>
                    <th className="px-4 py-3 font-semibold">Dates</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {partnerBookings.slice(0, 4).map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-medium text-white">
                        <Link href={`/partner/bookings/${booking.id}`}>
                          {booking.guest}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{booking.hotel}</td>
                      <td className="px-4 py-4 text-slate-400">{booking.dates}</td>
                      <td className="px-4 py-4">
                        <PartnerBadge tone={bookingTone(booking.status)}>
                          {booking.status}
                        </PartnerBadge>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{booking.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PartnerCard>
        </PartnerSection>

        <PartnerSection title="Quick actions" description="Common partner tasks.">
          <div className="grid gap-3">
            {partnerQuickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <PartnerCard className="transition hover:border-amber-300/30 hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{action.label}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRightIcon
                      className="h-5 w-5 shrink-0 text-amber-200"
                      aria-hidden="true"
                    />
                  </div>
                </PartnerCard>
              </Link>
            ))}
          </div>
        </PartnerSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PartnerSection title="Recent reviews" description="Feedback awaiting partner attention.">
          <div className="grid gap-4">
            {partnerReviews.slice(0, 3).map((review) => (
              <PartnerCard key={review.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{review.guest}</h3>
                      <PartnerBadge tone={review.status === "Unanswered" ? "amber" : "slate"}>
                        {review.status}
                      </PartnerBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{review.hotel}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    <StarIcon className="h-4 w-4" aria-hidden="true" />
                    {review.rating}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{review.comment}</p>
              </PartnerCard>
            ))}
          </div>
        </PartnerSection>

        <PartnerSection title="Occupancy snapshot" description="Static weekly demand sample.">
          <PartnerChartPlaceholder
            title="Portfolio occupancy"
            value="82%"
            caption="7-day blended occupancy"
            bars={[58, 66, 78, 84, 91, 87, 82]}
          />
        </PartnerSection>
      </div>
    </>
  );
}
