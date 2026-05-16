import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  accountStatusTone,
  paymentStatusTone,
  reviewStatusTone,
  severityTone,
} from "@/lib/admin-display";
import {
  adminAuditLogs,
  adminBookings,
  adminReports,
  adminReviews,
  adminUsers,
  partnerHotelHref,
} from "@/lib/admin-mock-data";
import type {
  AdminAuditLog,
  AdminBooking,
  AdminDetailPageProps,
  AdminReport,
  AdminReviewCase,
  AdminTableColumn,
} from "@/types/admin";

const bookingColumns: AdminTableColumn<AdminBooking>[] = [
  {
    header: "Booking",
    render: (booking) => (
      <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
        {booking.id}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (booking) => (
      <Link href={partnerHotelHref(booking.hotelId)} className="text-slate-300 hover:text-blue-200">
        {booking.hotelName}
      </Link>
    ),
  },
  { header: "Dates", render: (booking) => booking.dates },
  {
    header: "Payment",
    render: (booking) => <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />,
  },
];

const reviewColumns: AdminTableColumn<AdminReviewCase>[] = [
  {
    header: "Review",
    render: (review) => <span className="line-clamp-2 text-slate-300">{review.excerpt}</span>,
  },
  {
    header: "Hotel / partner",
    render: (review) => (
      <Link href={partnerHotelHref(review.hotelId)} className="hover:text-blue-200">
        {review.hotelName}
      </Link>
    ),
  },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  {
    header: "Status",
    render: (review) => <AdminStatusBadge label={review.status} tone={reviewStatusTone(review.status)} />,
  },
];

const reportColumns: AdminTableColumn<AdminReport>[] = [
  { header: "Report", render: (report) => report.reason },
  {
    header: "Severity",
    render: (report) => <AdminStatusBadge label={report.severity} tone={severityTone(report.severity)} />,
  },
  { header: "Status", render: (report) => report.status },
];

const timelineColumns: AdminTableColumn<AdminAuditLog>[] = [
  { header: "Time", render: (log) => log.timestamp },
  { header: "Actor", render: (log) => log.actor },
  { header: "Action", render: (log) => log.action },
  {
    header: "Severity",
    render: (log) => <AdminStatusBadge label={log.severity} tone={severityTone(log.severity)} />,
  },
];

export default async function Page({ params }: AdminDetailPageProps) {
  const { id } = await params;
  const user = adminUsers.find((item) => item.id === id) ?? adminUsers[0];
  const bookings = adminBookings.filter((booking) => booking.userId === user.id);
  const reviews = adminReviews.filter((review) => review.userId === user.id);
  const reports = adminReports.filter((report) => report.subjectId === user.id);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Account inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            {user.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{user.email}</p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Users", href: "/admin/users", tone: "neutral" },
            { label: "Suspend", href: `/admin/users/${user.id}?action=suspend`, tone: "red" },
            { label: "Activate", href: `/admin/users/${user.id}?action=activate`, tone: "blue" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Role</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{user.role}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Status</p>
          <div className="mt-2">
            <AdminStatusBadge label={user.status} tone={accountStatusTone(user.status)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Risk score</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{user.riskScore}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Joined</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{user.joinedAt}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Booking history">
          <AdminTable rows={bookings} columns={bookingColumns} getRowKey={(booking) => booking.id} />
        </AdminSection>
        <AdminSection title="Reviews">
          <AdminTable rows={reviews} columns={reviewColumns} getRowKey={(review) => review.id} />
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Reports">
          <AdminTable rows={reports} columns={reportColumns} getRowKey={(report) => report.id} />
        </AdminSection>
        <AdminSection title="Activity timeline" description="Static audit stream scoped to this account view.">
          <AdminTable rows={adminAuditLogs} columns={timelineColumns} getRowKey={(log) => log.id} />
        </AdminSection>
      </div>

      <AdminSection title="Moderation notes">
        <AdminPanel className="p-4 text-xs leading-6 text-slate-400">
          No persistent notes are stored in this scaffold. This panel reserves
          the future surface for operator annotations, escalation references,
          and review outcomes.
        </AdminPanel>
      </AdminSection>
    </>
  );
}
