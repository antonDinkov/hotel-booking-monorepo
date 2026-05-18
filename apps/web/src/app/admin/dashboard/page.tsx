import Link from "next/link";
import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  activeStatusTone,
  bookingStatusTone,
  paymentStatusTone,
  reviewModerationStatusTone,
  verificationStatusTone,
} from "@/lib/admin-display";
import { getAdminDashboard } from "@/server/services/adminDashboard";
import type { AdminBadgeTone, AdminTableColumn } from "@/types/admin";
import type {
  AdminDashboardPartner,
  AdminDashboardRecentBooking,
  AdminDashboardRecentReview,
  AdminDashboardRecentUser,
  AdminDashboardResult,
  AdminDashboardSummaryItem,
} from "@/types/admin-dashboard";

const quickActions = [
  { label: "Users", href: "/admin/users", tone: "blue" as const },
  { label: "Partners", href: "/admin/partners", tone: "amber" as const },
  { label: "Bookings", href: "/admin/bookings", tone: "neutral" as const },
  { label: "Reviews", href: "/admin/reviews", tone: "neutral" as const },
  { label: "Reports", href: "/admin/reports", tone: "red" as const },
  { label: "Payments", href: "/admin/payments", tone: "blue" as const },
  { label: "Analytics", href: "/admin/analytics", tone: "neutral" as const },
  { label: "System", href: "/admin/system", tone: "amber" as const },
  { label: "Settings", href: "/admin/settings", tone: "neutral" as const },
];

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
  return auth.roles;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function formatDateTime(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value)) : "Not set";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

function displayName(user: AdminDashboardRecentUser): string {
  return user.fullName?.trim() || user.email.split("@")[0] || user.email;
}

function roleBadgeTone(role: string): AdminBadgeTone {
  if (role === "admin") return "red";
  if (role === "partner") return "amber";
  return "neutral";
}

function tableEmpty(title: string, description: string) {
  return <AdminEmptyState title={title} description={description} />;
}

function DashboardPageHeader({ generatedAt }: { generatedAt?: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Global platform overview
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            Admin dashboard
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Database-backed operations overview for users, partners, inventory,
            bookings, payments, reviews, and platform health.
            {generatedAt ? ` Generated ${formatDateTime(generatedAt)}.` : ""}
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Reports", href: "/admin/reports", tone: "red" },
            { label: "System", href: "/admin/system", tone: "amber" },
            { label: "Payments", href: "/admin/payments", tone: "neutral" },
          ]}
        />
      </div>
    </div>
  );
}

function OverviewCards({ dashboard }: { dashboard: AdminDashboardResult }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {dashboard.statCards.map((stat) => (
        <AdminStatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

function SummaryPanel({
  title,
  items,
}: {
  title: string;
  items: AdminDashboardSummaryItem[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminPanel className="space-y-3 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-xs">
          <AdminStatusBadge label={item.label} tone={item.tone} />
          <div className="h-2 overflow-hidden rounded-[2px] bg-slate-900">
            <div
              className="h-full bg-blue-500/50"
              style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-slate-300">{formatNumber(item.value)}</span>
        </div>
      ))}
    </AdminPanel>
  );
}

function RevenueSummary({ dashboard }: { dashboard: AdminDashboardResult }) {
  const max = Math.max(1, ...dashboard.revenueTrend.map((point) => point.value));

  return (
    <AdminPanel className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-slate-50">
            {formatCurrency(dashboard.metrics.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCurrency(dashboard.metrics.revenueThisMonth)} this month / {dashboard.rangeLabel}
          </p>
        </div>
        <AdminStatusBadge label="finance" tone="blue" />
      </div>
      <div className="mt-6 flex h-32 items-end gap-2 border-b border-slate-800">
        {dashboard.revenueTrend.map((point) => (
          <div
            key={point.label}
            title={`${point.label}: ${formatCurrency(point.value)}`}
            className="w-full bg-blue-500/45"
            style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <Link href="/admin/analytics" className="mt-4 inline-block text-xs font-semibold text-blue-200 hover:text-blue-100">
        Open analytics
      </Link>
    </AdminPanel>
  );
}

const userColumns: AdminTableColumn<AdminDashboardRecentUser>[] = [
  {
    header: "User",
    render: (user) => (
      <div>
        <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {displayName(user)}
        </Link>
        <p className="mt-1 text-slate-500">{user.email}</p>
      </div>
    ),
  },
  {
    header: "Roles",
    render: (user) => (
      <div className="flex flex-wrap gap-1">
        {user.roles.length ? user.roles.map((role) => (
          <AdminStatusBadge key={role} label={role} tone={roleBadgeTone(role)} />
        )) : <AdminStatusBadge label="none" />}
      </div>
    ),
  },
  {
    header: "Status",
    render: (user) => (
      <AdminStatusBadge
        label={user.isActive ? "active" : "inactive"}
        tone={activeStatusTone(user.isActive)}
      />
    ),
  },
  { header: "Created", render: (user) => formatDate(user.createdAt) },
];

const partnerColumns: AdminTableColumn<AdminDashboardPartner>[] = [
  {
    header: "Partner",
    render: (partner) => (
      <div>
        <Link href={`/admin/partners/${partner.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          {partner.companyName}
        </Link>
        <p className="mt-1 text-slate-500">{partner.email}</p>
      </div>
    ),
  },
  { header: "Representative", render: (partner) => partner.representativeName },
  {
    header: "Verification",
    render: (partner) => (
      <AdminStatusBadge
        label={partner.verificationStatus}
        tone={verificationStatusTone(partner.verificationStatus)}
      />
    ),
  },
  {
    header: "Verified",
    render: (partner) => (
      <AdminStatusBadge label={partner.isVerified ? "true" : "false"} tone={partner.isVerified ? "blue" : "red"} />
    ),
  },
  { header: "Created", render: (partner) => formatDate(partner.createdAt) },
];

const pendingPartnerColumns: AdminTableColumn<AdminDashboardPartner>[] = [
  {
    header: "Partner",
    render: (partner) => (
      <Link href={`/admin/partners/${partner.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
        {partner.companyName}
      </Link>
    ),
  },
  { header: "Representative", render: (partner) => partner.representativeName },
  { header: "Email", render: (partner) => partner.email },
  { header: "Created", render: (partner) => formatDate(partner.createdAt) },
  {
    header: "Actions",
    render: (partner) => (
      <AdminActionMenu actions={[{ label: "Inspect", href: `/admin/partners/${partner.id}`, tone: "blue" }]} />
    ),
  },
];

const bookingColumns: AdminTableColumn<AdminDashboardRecentBooking>[] = [
  {
    header: "Booking",
    render: (booking) => (
      <div>
        <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          #{booking.id}
        </Link>
        <p className="mt-1 text-slate-500">{booking.checkInDate} to {booking.checkOutDate}</p>
      </div>
    ),
  },
  {
    header: "Guest",
    render: (booking) => (
      <Link href={`/admin/users/${booking.guestUserId}`} className="hover:text-blue-200">
        {booking.guestFullName}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (booking) => (
      <div>
        <span className="font-semibold text-slate-100">{booking.hotelName}</span>
        <Link href={`/admin/partners/${booking.partnerId}`} className="mt-1 block text-slate-500 hover:text-blue-200">
          {booking.partnerCompanyName}
        </Link>
        <p className="mt-1 text-slate-500">{booking.roomTypeName}</p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (booking) => <AdminStatusBadge label={booking.status} tone={bookingStatusTone(booking.status)} />,
  },
  {
    header: "Payment",
    render: (booking) => <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />,
  },
  { header: "Total", render: (booking) => formatCurrency(booking.totalPrice) },
];

const reviewColumns: AdminTableColumn<AdminDashboardRecentReview>[] = [
  {
    header: "Review",
    render: (review) => (
      <div>
        <Link href={`/admin/reviews/${review.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
          #{review.id}
        </Link>
        <p className="mt-1 line-clamp-2 text-slate-500">{review.commentPreview}</p>
      </div>
    ),
  },
  {
    header: "Guest",
    render: (review) => (
      <Link href={`/admin/users/${review.userId}`} className="hover:text-blue-200">
        {review.guestFullName}
      </Link>
    ),
  },
  {
    header: "Hotel / partner",
    render: (review) => (
      <div>
        <span className="font-semibold text-slate-100">{review.hotelName}</span>
        <Link href={`/admin/partners/${review.partnerId}`} className="mt-1 block text-slate-500 hover:text-blue-200">
          {review.partnerCompanyName}
        </Link>
      </div>
    ),
  },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  {
    header: "Moderation",
    render: (review) => (
      <AdminStatusBadge
        label={review.moderationStatus}
        tone={reviewModerationStatusTone(review.moderationStatus)}
      />
    ),
  },
  {
    header: "Reply",
    render: (review) => (
      <span className={review.hasPartnerReply ? "text-blue-200" : "text-slate-500"}>
        {review.hasPartnerReply ? "Replied" : "Not replied"}
      </span>
    ),
  },
  { header: "Created", render: (review) => formatDate(review.createdAt) },
];

const healthColumns: AdminTableColumn<AdminDashboardResult["systemHealth"][number]>[] = [
  {
    header: "Service",
    render: (check) => (
      <div>
        <p className="font-semibold text-slate-100">{check.name}</p>
        <p className="mt-1 text-slate-500">{check.detail}</p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (check) => <AdminStatusBadge label={check.status} tone={check.tone} />,
  },
  { header: "Updated", render: (check) => formatDateTime(check.updatedAt) },
];

function DashboardTables({ dashboard }: { dashboard: AdminDashboardResult }) {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Recent users" description="Latest registered accounts without sensitive credential fields.">
          <AdminTable
            rows={dashboard.recentUsers}
            columns={userColumns}
            getRowKey={(user) => user.id}
            emptyState={tableEmpty("No users found", "No user accounts are available yet.")}
          />
        </AdminSection>
        <AdminSection title="Recent partners" description="Latest partner profiles and verification state.">
          <AdminTable
            rows={dashboard.recentPartners}
            columns={partnerColumns}
            getRowKey={(partner) => partner.id}
            emptyState={tableEmpty("No partners found", "No partner profiles are available yet.")}
          />
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <AdminSection title="Pending partner approvals" description="Partner applications waiting for verification review.">
          <AdminTable
            rows={dashboard.pendingPartnerApprovals}
            columns={pendingPartnerColumns}
            getRowKey={(partner) => partner.id}
            emptyState={tableEmpty("No pending approvals", "There are no partner applications waiting for review.")}
          />
        </AdminSection>
        <AdminSection title="Recent bookings" description="Latest reservations with guest, hotel, partner, room, payment, and total price data.">
          <AdminTable
            rows={dashboard.recentBookings}
            columns={bookingColumns}
            getRowKey={(booking) => String(booking.id)}
            emptyState={tableEmpty("No bookings found", "No booking records are available yet.")}
          />
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <AdminSection title="Recent reviews" description="Latest guest reviews with moderation and partner reply state.">
          <AdminTable
            rows={dashboard.recentReviews}
            columns={reviewColumns}
            getRowKey={(review) => String(review.id)}
            emptyState={tableEmpty("No reviews found", "No guest reviews are available yet.")}
          />
        </AdminSection>
        <AdminSection title="System health" description="Operational indicators from the existing admin system service.">
          <AdminTable
            rows={dashboard.systemHealth}
            columns={healthColumns}
            getRowKey={(check) => check.name}
            emptyState={tableEmpty("No system checks", "System health checks are not available.")}
          />
        </AdminSection>
      </div>
    </>
  );
}

function DashboardSummaries({ dashboard }: { dashboard: AdminDashboardResult }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <AdminSection title="Revenue summary" description="Paid confirmed/completed bookings, excluding cancelled stays.">
        <RevenueSummary dashboard={dashboard} />
      </AdminSection>

      <div className="grid gap-5">
        <AdminSection title="Booking status summary">
          <SummaryPanel title="Booking status" items={dashboard.bookingStatusSummary} />
        </AdminSection>
        <AdminSection title="Review moderation summary">
          <SummaryPanel title="Review moderation" items={dashboard.reviewModerationSummary} />
        </AdminSection>
      </div>
    </div>
  );
}

function OccupancySummary({ dashboard }: { dashboard: AdminDashboardResult }) {
  return (
    <AdminSection title="Occupancy summary" description="Room nights booked divided by total available room nights for the dashboard range.">
      <AdminPanel className="grid gap-4 p-4 md:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Average occupancy</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {percent(dashboard.metrics.averageOccupancyRate)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Total inventory</p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {formatNumber(dashboard.metrics.totalRoomInventory)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Range</p>
          <p className="mt-2 text-sm font-semibold text-slate-50">{dashboard.rangeLabel}</p>
        </div>
      </AdminPanel>
    </AdminSection>
  );
}

function QuickActions() {
  return (
    <AdminSection title="Quick actions" description="Direct links to existing admin operations sections.">
      <AdminPanel className="p-4">
        <AdminActionMenu actions={quickActions} />
      </AdminPanel>
    </AdminSection>
  );
}

function DashboardError() {
  return (
    <AdminSection title="Dashboard unavailable">
      <AdminPanel className="p-4 text-xs leading-6 text-red-200">
        Admin dashboard data could not be loaded. Check the server logs and
        database connection, then refresh the page.
      </AdminPanel>
    </AdminSection>
  );
}

export default async function Page() {
  const roles = await requireAdmin();

  let dashboard: AdminDashboardResult | null = null;
  try {
    dashboard = await getAdminDashboard(roles);
  } catch (error) {
    console.error("Admin dashboard page failed:", error);
  }

  if (!dashboard) {
    return (
      <>
        <DashboardPageHeader />
        <DashboardError />
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader generatedAt={dashboard.generatedAt} />
      <OverviewCards dashboard={dashboard} />
      <DashboardSummaries dashboard={dashboard} />
      <OccupancySummary dashboard={dashboard} />
      <DashboardTables dashboard={dashboard} />
      <QuickActions />
    </>
  );
}
