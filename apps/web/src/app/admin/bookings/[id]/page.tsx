import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { paymentStatusTone, severityTone } from "@/lib/admin-display";
import {
  adminAuditLogs,
  adminBookings,
  adminPayments,
  adminReports,
  adminUsers,
  getAdminHotelById,
  getAdminPartnerForHotel,
  partnerHotelHref,
} from "@/lib/admin-mock-data";
import type {
  AdminAuditLog,
  AdminDetailPageProps,
  AdminPayment,
  AdminReport,
  AdminTableColumn,
} from "@/types/admin";

const paymentColumns: AdminTableColumn<AdminPayment>[] = [
  { header: "Payment", render: (payment) => payment.id },
  { header: "Type", render: (payment) => payment.type },
  {
    header: "Status",
    render: (payment) => <AdminStatusBadge label={payment.status} tone={paymentStatusTone(payment.status)} />,
  },
  { header: "Amount", render: (payment) => payment.amount },
  { header: "Risk", render: (payment) => payment.risk },
];

const disputeColumns: AdminTableColumn<AdminReport>[] = [
  { header: "Case", render: (report) => report.id },
  { header: "Reason", render: (report) => report.reason },
  {
    header: "Severity",
    render: (report) => <AdminStatusBadge label={report.severity} tone={severityTone(report.severity)} />,
  },
  { header: "Status", render: (report) => report.status },
];

const auditColumns: AdminTableColumn<AdminAuditLog>[] = [
  { header: "Time", render: (log) => log.timestamp },
  { header: "Actor", render: (log) => log.actor },
  { header: "Action", render: (log) => log.action },
  { header: "Target", render: (log) => log.target },
];

export default async function Page({ params }: AdminDetailPageProps) {
  const { id } = await params;
  const booking = adminBookings.find((item) => item.id === id) ?? adminBookings[0];
  const user = adminUsers.find((item) => item.id === booking.userId);
  const hotel = getAdminHotelById(booking.hotelId);
  const partner = getAdminPartnerForHotel(booking.hotelId);
  const payments = adminPayments.filter((payment) => payment.bookingId === booking.id);
  const disputes = adminReports.filter((report) => report.subjectId === booking.userId);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Booking inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            {booking.id}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{booking.dates}</p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Bookings", href: "/admin/bookings", tone: "neutral" },
            { label: "Refund", href: `/admin/bookings/${booking.id}?action=refund`, tone: "amber" },
            { label: "Escalate", href: `/admin/bookings/${booking.id}?action=escalate`, tone: "red" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Payment</p>
          <div className="mt-2">
            <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Amount</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{booking.amount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Status</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{booking.status}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Dispute</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{booking.disputeStatus}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Risk</p>
          <p className="mt-2 text-sm font-semibold text-amber-200">{booking.riskSignal}</p>
        </AdminPanel>
      </div>

      <AdminSection title="User and partner references">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminPanel className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Guest</p>
            <Link href={`/admin/users/${booking.userId}`} className="mt-2 block text-sm font-semibold text-blue-200 hover:text-blue-100">
              {user?.name ?? booking.guestName}
            </Link>
            <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
          </AdminPanel>
          <AdminPanel className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Partner account</p>
            <Link href={partnerHotelHref(booking.hotelId)} className="mt-2 block text-sm font-semibold text-blue-200 hover:text-blue-100">
              {partner?.companyName ?? "Partner account"}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              {hotel?.name ?? booking.hotelName} / {hotel?.city}
            </p>
          </AdminPanel>
        </div>
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Payment flow">
          <AdminTable rows={payments} columns={paymentColumns} getRowKey={(payment) => payment.id} />
        </AdminSection>
        <AdminSection title="Dispute history">
          <AdminTable rows={disputes} columns={disputeColumns} getRowKey={(report) => report.id} />
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <AdminSection title="Activity timeline">
          <AdminTable rows={adminAuditLogs} columns={auditColumns} getRowKey={(log) => log.id} />
        </AdminSection>
        <AdminSection title="Admin actions">
          <AdminPanel className="space-y-3 p-4">
            {["Freeze payout", "Open refund review", "Request user verification"].map((label) => (
              <Link
                key={label}
                href={`/admin/bookings/${booking.id}?action=${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="block border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-700"
              >
                {label}
              </Link>
            ))}
          </AdminPanel>
        </AdminSection>
      </div>
    </>
  );
}
