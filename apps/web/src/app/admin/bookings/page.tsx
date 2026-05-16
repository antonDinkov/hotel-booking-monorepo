import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { paymentStatusTone } from "@/lib/admin-display";
import { adminBookings, partnerHotelHref } from "@/lib/admin-mock-data";
import type { AdminBooking, AdminTableColumn } from "@/types/admin";

const bookingColumns: AdminTableColumn<AdminBooking>[] = [
  {
    header: "Booking",
    render: (booking) => (
      <div>
        <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {booking.id}
        </Link>
        <p className="mt-1 text-slate-500">{booking.dates}</p>
      </div>
    ),
  },
  {
    header: "Guest",
    render: (booking) => (
      <Link href={`/admin/users/${booking.userId}`} className="hover:text-blue-200">
        {booking.guestName}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (booking) => (
      <Link href={partnerHotelHref(booking.hotelId)} className="hover:text-blue-200">
        {booking.hotelName}
      </Link>
    ),
  },
  { header: "Status", render: (booking) => booking.status },
  {
    header: "Payment",
    render: (booking) => <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />,
  },
  { header: "Dispute", render: (booking) => booking.disputeStatus },
  {
    header: "Risk",
    render: (booking) => (
      <span className={booking.riskSignal === "normal" ? "text-slate-400" : "font-semibold text-amber-200"}>
        {booking.riskSignal}
      </span>
    ),
  },
  {
    header: "Actions",
    render: (booking) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: `/admin/bookings/${booking.id}`, tone: "blue" },
          { label: "Refund", href: `/admin/bookings/${booking.id}?action=refund`, tone: "amber" },
          { label: "Dispute", href: `/admin/bookings/${booking.id}?action=dispute`, tone: "red" },
        ]}
      />
    ),
  },
];

export default function Page() {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Reservation monitoring
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Booking monitoring
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Static operations queue for booking state, payment status, disputes,
          refunds, and suspicious activity.
        </p>
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/bookings", active: true, count: adminBookings.length },
          { label: "Paid", href: "/admin/bookings?payment=paid", count: 2, tone: "blue" },
          { label: "Pending", href: "/admin/bookings?payment=pending", count: 1, tone: "amber" },
          { label: "Failed", href: "/admin/bookings?payment=failed", count: 1, tone: "red" },
          { label: "Disputed", href: "/admin/bookings?payment=disputed", count: 1, tone: "red" },
        ]}
      />

      <AdminSection title="Bookings table" description="Bookings, payment outcomes, dispute signals, and inspection links.">
        <AdminTable rows={adminBookings} columns={bookingColumns} getRowKey={(booking) => booking.id} />
      </AdminSection>
    </>
  );
}
