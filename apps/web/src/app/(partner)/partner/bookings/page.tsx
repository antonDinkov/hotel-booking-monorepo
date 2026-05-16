import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { partnerBookings } from "@/lib/partner-mock-data";
import type { PartnerBadgeTone } from "@/types/partner";

const filters = ["Upcoming", "Completed", "Cancelled"];

function statusTone(status: string): PartnerBadgeTone {
  if (status === "Upcoming") return "emerald";
  if (status === "Cancelled") return "rose";
  return "slate";
}

function paymentTone(status: string): PartnerBadgeTone {
  if (status === "Paid") return "emerald";
  if (status === "Pending") return "amber";
  return "slate";
}

export default function Page() {
  return (
    <>
      <PartnerPageHeader
        eyebrow="Reservations"
        title="Bookings"
        description="Static bookings table with upcoming, completed, and cancelled filter controls for visual review."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={[
              "rounded-lg border px-4 py-2 text-sm font-semibold transition",
              filter === "Upcoming"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {filter}
          </button>
        ))}
      </div>

      <PartnerCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Hotel</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Dates</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {partnerBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-4 font-medium text-white">{booking.guest}</td>
                  <td className="px-4 py-4 text-slate-300">{booking.hotel}</td>
                  <td className="px-4 py-4 text-slate-400">{booking.room}</td>
                  <td className="px-4 py-4 text-slate-400">{booking.dates}</td>
                  <td className="px-4 py-4">
                    <PartnerBadge tone={paymentTone(booking.paymentStatus)}>
                      {booking.paymentStatus}
                    </PartnerBadge>
                  </td>
                  <td className="px-4 py-4">
                    <PartnerBadge tone={statusTone(booking.status)}>
                      {booking.status}
                    </PartnerBadge>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/partner/bookings/${booking.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                    >
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PartnerCard>
    </>
  );
}
