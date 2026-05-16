import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { paymentStatusTone } from "@/lib/admin-display";
import {
  adminPayments,
  getAdminHotelById,
  getAdminPartnerForHotel,
  partnerHotelHref,
} from "@/lib/admin-mock-data";
import type { AdminPayment, AdminTableColumn } from "@/types/admin";

const paymentColumns: AdminTableColumn<AdminPayment>[] = [
  { header: "Payment", render: (payment) => <span className="font-semibold text-slate-100">{payment.id}</span> },
  {
    header: "Booking",
    render: (payment) => (
      <Link href={`/admin/bookings/${payment.bookingId}`} className="hover:text-blue-200">
        {payment.bookingId}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (payment) => {
      const hotel = getAdminHotelById(payment.hotelId);

      return (
        <Link href={partnerHotelHref(payment.hotelId)} className="hover:text-blue-200">
          {hotel?.name ?? payment.hotelId}
        </Link>
      );
    },
  },
  {
    header: "Partner",
    render: (payment) => {
      const partner = getAdminPartnerForHotel(payment.hotelId);

      return (
        <Link href={partner ? `/admin/partners/${partner.id}` : "/admin/partners"} className="hover:text-blue-200">
          {partner?.companyName ?? payment.partnerName}
        </Link>
      );
    },
  },
  { header: "Type", render: (payment) => payment.type },
  {
    header: "Status",
    render: (payment) => <AdminStatusBadge label={payment.status} tone={paymentStatusTone(payment.status)} />,
  },
  { header: "Amount", render: (payment) => payment.amount },
  { header: "Risk", render: (payment) => payment.risk },
  {
    header: "Actions",
    render: (payment) => (
      <AdminActionMenu
        actions={[
          { label: "Booking", href: `/admin/bookings/${payment.bookingId}`, tone: "blue" },
          { label: "Hold", href: `/admin/payments?item=${payment.id}&action=hold`, tone: "amber" },
          { label: "Review", href: `/admin/payments?item=${payment.id}&action=review`, tone: "neutral" },
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
          Finance operations
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Payments
        </h1>
        <p className="max-w-3xl text-xs leading-5 text-slate-500">
          Static financial monitoring for payout queue, failed payments,
          refunds, disputes, and payment risk.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Payout queue", "$184K", "18 partner payouts pending"],
          ["Failed payments", "31", "card retries above baseline"],
          ["Refunds", "$12.8K", "open refund exposure"],
          ["Disputes", "7", "chargeback review queue"],
        ].map(([label, value, detail]) => (
          <AdminPanel key={label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </AdminPanel>
        ))}
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/payments", active: true, count: adminPayments.length },
          { label: "Failed", href: "/admin/payments?status=failed", count: 1, tone: "red" },
          { label: "Refunds", href: "/admin/payments?type=refund", count: 0 },
          { label: "Disputes", href: "/admin/payments?type=dispute", count: 1, tone: "red" },
          { label: "Payout queue", href: "/admin/payments?type=payout", count: 1, tone: "amber" },
        ]}
      />

      <AdminSection title="Financial operations table">
        <AdminTable rows={adminPayments} columns={paymentColumns} getRowKey={(payment) => payment.id} />
      </AdminSection>
    </>
  );
}
