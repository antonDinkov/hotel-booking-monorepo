import {
  ArrowRightIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  HomeModernIcon,
  PlusIcon,
  StarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerChartPlaceholder from "@/components/partner/PartnerChartPlaceholder";
import PartnerEmptyState from "@/components/partner/PartnerEmptyState";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import PartnerStatCard from "@/components/partner/PartnerStatCard";
import { getPartnerDashboard } from "@/server/services/partnerDashboard";
import type { BookingPaymentStatus } from "@/types/booking";
import type { PartnerBadgeTone, PartnerQuickAction } from "@/types/partner";
import type {
  PartnerDashboardBookingStatus,
  PartnerDashboardChartPoint,
  PartnerDashboardHotelPerformanceItemProps,
  PartnerDashboardHotelPerformanceListProps,
  PartnerDashboardPerformanceRowProps,
  PartnerDashboardRecentBookingItemProps,
  PartnerDashboardRecentBookingListProps,
  PartnerDashboardRecentReviewItemProps,
  PartnerDashboardRecentReviewListProps,
  PartnerDashboardResult,
  PartnerDashboardSectionLinkProps,
  PartnerDashboardSummaryCard,
  PartnerDashboardUpcomingCheckInItemProps,
  PartnerDashboardUpcomingCheckInListProps,
  PartnerDashboardViewProps,
} from "@/types/partner-dashboard";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const quickActions: PartnerQuickAction[] = [
  {
    label: "Manage hotels",
    description: "Open the owned hotel portfolio",
    href: "/partner/hotels",
  },
  {
    label: "Add hotel",
    description: "Create a new portfolio property",
    href: "/partner/hotels/add",
  },
  {
    label: "Open bookings",
    description: "Review reservations and arrivals",
    href: "/partner/bookings",
  },
  {
    label: "Reply to reviews",
    description: "Answer recent guest feedback",
    href: "/partner/reviews",
  },
  {
    label: "Review calendar",
    description: "Check room availability",
    href: "/partner/calendar",
  },
  {
    label: "View analytics",
    description: "Inspect revenue and occupancy trends",
    href: "/partner/analytics",
  },
  {
    label: "Settings",
    description: "Manage company and payout details",
    href: "/partner/settings",
  },
];

const bookingStatusLabels: Record<PartnerDashboardBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const paymentStatusLabels: Record<BookingPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  refund_denied: "Refund denied",
};

const statIcons = [
  BuildingOffice2Icon,
  HomeModernIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  BanknotesIcon,
  ChartBarIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleLeftRightIcon,
];

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatRating(value: number | null): string {
  return value === null ? "New" : value.toFixed(2);
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatShortDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatDateRange(checkInDate: string, checkOutDate: string): string {
  return `${formatShortDate(checkInDate)} - ${formatShortDate(checkOutDate)}`;
}

function statusTone(status: PartnerDashboardBookingStatus): PartnerBadgeTone {
  if (status === "confirmed" || status === "completed") return "emerald";
  if (status === "cancelled") return "rose";
  return "amber";
}

function paymentTone(status: BookingPaymentStatus): PartnerBadgeTone {
  if (status === "paid") return "emerald";
  if (status === "pending" || status === "refund_pending") return "amber";
  if (status === "failed" || status === "cancelled" || status === "refunded") return "rose";
  return "slate";
}

function toChartBars(points: PartnerDashboardChartPoint[]): number[] {
  const max = Math.max(...points.map((point) => point.value), 0);
  if (max <= 0) return points.map(() => 4);

  return points.map((point) => Math.max((point.value / max) * 100, point.value > 0 ? 8 : 4));
}

function toOccupancyBars(points: PartnerDashboardChartPoint[]): number[] {
  return points.map((point) => {
    if (point.value <= 0) return 4;
    return Math.min(100, Math.max(point.value, 8));
  });
}

function buildSummaryCards(
  dashboard: PartnerDashboardResult
): PartnerDashboardSummaryCard[] {
  const { metrics } = dashboard;

  return [
    { label: "Total hotels", value: formatNumber(metrics.totalHotels), detail: "Owned portfolio", tone: "slate" },
    { label: "Room types", value: formatNumber(metrics.totalRoomTypes), detail: "Configured inventory", tone: "indigo" },
    { label: "Room inventory", value: formatNumber(metrics.totalRoomInventory), detail: "Rooms across room types", tone: "indigo" },
    { label: "Total bookings", value: formatNumber(metrics.totalBookings), detail: "All portfolio reservations", tone: "indigo" },
    { label: "Upcoming bookings", value: formatNumber(metrics.upcomingBookings), detail: "Future check-ins", tone: "emerald" },
    { label: "Pending bookings", value: formatNumber(metrics.pendingBookings), detail: "Awaiting confirmation", tone: "amber" },
    { label: "Confirmed bookings", value: formatNumber(metrics.confirmedBookings), detail: "Active reservations", tone: "emerald" },
    { label: "Cancelled bookings", value: formatNumber(metrics.cancelledBookings), detail: "Cancelled stays", tone: "rose" },
    { label: "Completed bookings", value: formatNumber(metrics.completedBookings), detail: "Finished stays", tone: "slate" },
    { label: "Total revenue", value: formatCurrency(metrics.totalRevenue), detail: "Paid confirmed stays", tone: "emerald" },
    { label: "Revenue this month", value: formatCurrency(metrics.revenueThisMonth), detail: "Month-to-date room nights", tone: "emerald" },
    { label: "Average occupancy", value: formatPercent(metrics.averageOccupancyRate), detail: "Last 30 days", tone: "amber" },
    { label: "Average rating", value: formatRating(metrics.averageReviewRating), detail: "Published reviews", tone: "amber" },
    { label: "Total reviews", value: formatNumber(metrics.totalReviews), detail: "Published feedback", tone: "slate" },
    { label: "Unreplied reviews", value: formatNumber(metrics.unrepliedReviewsCount), detail: "Need partner reply", tone: "amber" },
  ];
}

function OverviewCards({ dashboard }: PartnerDashboardViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {buildSummaryCards(dashboard).map((stat, index) => {
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
  );
}

function RecentBookings({ dashboard }: PartnerDashboardViewProps) {
  return (
    <PartnerSection
      title="Recent bookings"
      description="Latest reservations across the partner portfolio."
      actions={<SectionLink href="/partner/bookings" label="View all" />}
    >
      <RecentBookingsTable bookings={dashboard.recentBookings} />
    </PartnerSection>
  );
}

function RecentBookingsTable({ bookings }: PartnerDashboardRecentBookingListProps) {
  return (
    <PartnerCard className="overflow-hidden p-0">
      {bookings.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <RecentBookingsTableHead />
            <tbody className="divide-y divide-white/10">
              {bookings.map((booking) => (
                <RecentBookingRow key={booking.id} booking={booking} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PartnerEmptyState
          title="No bookings yet"
          description="New reservations for your owned hotels will appear here."
        />
      )}
    </PartnerCard>
  );
}

function RecentBookingsTableHead() {
  return (
    <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
      <tr>
        <th className="px-4 py-3 font-semibold">Booking</th>
        <th className="px-4 py-3 font-semibold">Guest</th>
        <th className="px-4 py-3 font-semibold">Hotel / Room</th>
        <th className="px-4 py-3 font-semibold">Dates</th>
        <th className="px-4 py-3 font-semibold">Status</th>
        <th className="px-4 py-3 font-semibold">Payment</th>
        <th className="px-4 py-3 font-semibold">Total</th>
      </tr>
    </thead>
  );
}

function RecentBookingRow({ booking }: PartnerDashboardRecentBookingItemProps) {
  return (
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-4 font-medium text-white">
        <Link href={`/partner/bookings/${booking.id}`}>#{booking.id}</Link>
      </td>
      <td className="px-4 py-4 text-slate-300">{booking.guestFullName}</td>
      <td className="px-4 py-4">
        <p className="font-medium text-slate-200">{booking.hotelName}</p>
        <p className="mt-1 text-xs text-slate-500">{booking.roomTypeName}</p>
      </td>
      <td className="px-4 py-4 text-slate-400">
        {formatDateRange(booking.checkInDate, booking.checkOutDate)}
      </td>
      <td className="px-4 py-4">
        <PartnerBadge tone={statusTone(booking.status)}>
          {bookingStatusLabels[booking.status]}
        </PartnerBadge>
      </td>
      <td className="px-4 py-4">
        <PartnerBadge tone={paymentTone(booking.paymentStatus)}>
          {paymentStatusLabels[booking.paymentStatus]}
        </PartnerBadge>
      </td>
      <td className="px-4 py-4 font-semibold text-slate-200">
        {formatCurrency(booking.totalPrice)}
      </td>
    </tr>
  );
}

function SectionLink({ href, label }: PartnerDashboardSectionLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100"
    >
      {label}
      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function QuickActions() {
  return (
    <PartnerSection title="Quick actions" description="Common partner tasks.">
      <div className="grid gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <PartnerCard className="transition hover:border-amber-300/30 hover:bg-white/[0.08]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">{action.label}</h3>
                  <p className="mt-1 text-sm text-slate-400">{action.description}</p>
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
  );
}

function UpcomingCheckIns({ dashboard }: PartnerDashboardViewProps) {
  return (
    <PartnerSection
      title="Upcoming check-ins"
      description="Future arrivals that are not cancelled."
      actions={<SectionLink href="/partner/calendar" label="Calendar" />}
    >
      <UpcomingCheckInList checkIns={dashboard.upcomingCheckIns} />
    </PartnerSection>
  );
}

function UpcomingCheckInList({
  checkIns,
}: PartnerDashboardUpcomingCheckInListProps) {
  return (
    <div className="grid gap-4">
      {checkIns.length ? (
        checkIns.map((booking) => (
          <UpcomingCheckInCard key={booking.id} booking={booking} />
        ))
      ) : (
        <PartnerEmptyState
          title="No upcoming check-ins"
          description="Confirmed future arrivals will appear here."
        />
      )}
    </div>
  );
}

function UpcomingCheckInCard({
  booking,
}: PartnerDashboardUpcomingCheckInItemProps) {
  return (
    <PartnerCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">{booking.guestFullName}</h3>
          <p className="mt-1 text-sm text-slate-400">{booking.hotelName}</p>
          <p className="mt-1 text-xs text-slate-500">{booking.roomTypeName}</p>
        </div>
        <div className="text-sm text-slate-300 sm:text-right">
          <p className="font-semibold text-amber-200">
            {formatDate(booking.checkInDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {booking.guestsCount} guests / {booking.roomsCount} rooms
          </p>
        </div>
      </div>
    </PartnerCard>
  );
}

function RecentReviews({ dashboard }: PartnerDashboardViewProps) {
  return (
    <PartnerSection
      title="Recent reviews"
      description="Published guest feedback for owned hotels."
      actions={<SectionLink href="/partner/reviews" label="Open reviews" />}
    >
      <RecentReviewList reviews={dashboard.recentReviews} />
    </PartnerSection>
  );
}

function RecentReviewList({ reviews }: PartnerDashboardRecentReviewListProps) {
  return (
    <div className="grid gap-4">
      {reviews.length ? (
        reviews.map((review) => <RecentReviewCard key={review.id} review={review} />)
      ) : (
        <PartnerEmptyState
          title="No reviews yet"
          description="Published guest reviews for your hotels will appear here."
        />
      )}
    </div>
  );
}

function RecentReviewCard({ review }: PartnerDashboardRecentReviewItemProps) {
  return (
    <PartnerCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{review.guestFullName}</h3>
            <PartnerBadge tone={review.replyStatus === "not_replied" ? "amber" : "slate"}>
              {review.replyStatus === "not_replied" ? "Unanswered" : "Replied"}
            </PartnerBadge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{review.hotelName}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(review.createdAt)}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
          <StarIcon className="h-4 w-4" aria-hidden="true" />
          {review.rating}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        {review.commentPreview}
      </p>
    </PartnerCard>
  );
}

function RevenueAndOccupancy({ dashboard }: PartnerDashboardViewProps) {
  const { metrics } = dashboard;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PartnerSection title="Revenue summary" description="Paid room-night revenue.">
        <PartnerChartPlaceholder
          title="Last 7 days"
          value={formatCurrency(metrics.revenueThisMonth)}
          caption="Month-to-date revenue"
          bars={toChartBars(dashboard.revenueTrend)}
          badgeLabel="Live"
        />
      </PartnerSection>

      <PartnerSection title="Occupancy summary" description="Booked room nights divided by available room nights.">
        <PartnerChartPlaceholder
          title="Portfolio occupancy"
          value={formatPercent(metrics.averageOccupancyRate)}
          caption={`${formatNumber(metrics.occupancyBookedRoomNights)} of ${formatNumber(metrics.occupancyAvailableRoomNights)} room nights`}
          bars={toOccupancyBars(dashboard.occupancyTrend)}
          badgeLabel="Live"
        />
      </PartnerSection>
    </div>
  );
}

function HotelPerformance({ dashboard }: PartnerDashboardViewProps) {
  return (
    <PartnerSection
      title="Hotel performance summary"
      description="Top owned hotels by paid revenue and booking activity."
      actions={<SectionLink href="/partner/analytics" label="Analytics" />}
    >
      <HotelPerformanceList hotels={dashboard.hotelPerformance} />
    </PartnerSection>
  );
}

function HotelPerformanceList({
  hotels,
}: PartnerDashboardHotelPerformanceListProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {hotels.length ? (
        hotels.map((hotel) => (
          <HotelPerformanceCard key={hotel.hotelId} hotel={hotel} />
        ))
      ) : (
        <HotelPerformanceEmptyState />
      )}
    </div>
  );
}

function HotelPerformanceCard({
  hotel,
}: PartnerDashboardHotelPerformanceItemProps) {
  return (
    <PartnerCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{hotel.hotelName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {hotel.roomTypeCount} room types / {hotel.imageCount} photos
          </p>
        </div>
        <PartnerBadge tone="emerald">{formatCurrency(hotel.revenue)}</PartnerBadge>
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <PerformanceRow label="Bookings" value={formatNumber(hotel.bookingsCount)} />
        <PerformanceRow label="Inventory" value={formatNumber(hotel.roomInventory)} />
        <PerformanceRow label="Occupancy" value={formatPercent(hotel.occupancyRate)} />
        <PerformanceRow label="Rating" value={formatRating(hotel.averageRating)} />
        <PerformanceRow label="Reviews" value={formatNumber(hotel.totalReviews)} />
      </div>
    </PartnerCard>
  );
}

function HotelPerformanceEmptyState() {
  return (
    <div className="xl:col-span-5">
      <PartnerEmptyState
        title="No hotel performance yet"
        description="Add hotels and room types to start tracking performance."
        action={
          <Link
            href="/partner/hotels/add"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add hotel
          </Link>
        }
      />
    </div>
  );
}

function PerformanceRow({ label, value }: PartnerDashboardPerformanceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function handleDashboardError(error: unknown): never {
  if (error instanceof Error && error.message === "PARTNER_PROFILE_NOT_FOUND") {
    redirect("/partner/login");
  }

  throw error;
}

export default async function Page() {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const dashboard = await getPartnerDashboard(auth.userId).catch(handleDashboardError);

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
              href="/partner/hotels/add"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              Add hotel
            </Link>
          </>
        }
      />

      <OverviewCards dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <RecentBookings dashboard={dashboard} />
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingCheckIns dashboard={dashboard} />
        <RecentReviews dashboard={dashboard} />
      </div>

      <RevenueAndOccupancy dashboard={dashboard} />
      <HotelPerformance dashboard={dashboard} />
    </>
  );
}
