import Link from "next/link";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import {
  accountStatusTone,
  moderationStatusTone,
  paymentStatusTone,
  reviewStatusTone,
  severityTone,
} from "@/lib/admin-display";
import {
  adminBookings,
  adminPartners,
  adminReports,
  adminReviews,
  adminRoomSnapshots,
  getAdminHotelsForPartner,
} from "@/lib/admin-mock-data";
import type {
  AdminBooking,
  AdminDetailPageProps,
  AdminHotel,
  AdminReport,
  AdminReviewCase,
  AdminRoomSnapshot,
  AdminTableColumn,
} from "@/types/admin";

function getHotelIds(hotels: AdminHotel[]) {
  return new Set(hotels.map((hotel) => hotel.id));
}

function sumFlags(hotels: AdminHotel[]) {
  return hotels.reduce((total, hotel) => total + hotel.flags, 0);
}

function sumBookings(hotels: AdminHotel[]) {
  return hotels.reduce((total, hotel) => total + hotel.bookings, 0);
}

function sumRooms(hotels: AdminHotel[]) {
  return hotels.reduce((total, hotel) => total + hotel.rooms, 0);
}

const hotelColumns: AdminTableColumn<AdminHotel>[] = [
  {
    header: "Hotel",
    render: (hotel) => (
      <div>
        <span className="font-semibold text-slate-100">{hotel.name}</span>
        <p className="mt-1 text-slate-500">{hotel.city}</p>
      </div>
    ),
  },
  {
    header: "Approval",
    render: (hotel) => <AdminStatusBadge label={hotel.approvalStatus} tone={moderationStatusTone(hotel.approvalStatus)} />,
  },
  { header: "Score", render: (hotel) => hotel.reviewScore },
  { header: "Rooms", render: (hotel) => hotel.rooms },
  {
    header: "Flags",
    render: (hotel) => (
      <span className={hotel.flags > 5 ? "font-semibold text-red-200" : "text-slate-400"}>
        {hotel.flags}
      </span>
    ),
  },
  { header: "Payout", render: (hotel) => hotel.payoutStatus },
  {
    header: "Actions",
    render: (hotel) => (
      <AdminActionMenu
        actions={[
          { label: "Inspect", href: `/admin/partners/${hotel.ownerId}?hotel=${hotel.id}`, tone: "blue" },
          { label: "Approve", href: `/admin/partners/${hotel.ownerId}?hotel=${hotel.id}&action=approve`, tone: "blue" },
          { label: "Reject", href: `/admin/partners/${hotel.ownerId}?hotel=${hotel.id}&action=reject`, tone: "amber" },
          { label: "Suspend", href: `/admin/partners/${hotel.ownerId}?hotel=${hotel.id}&action=suspend`, tone: "red" },
        ]}
      />
    ),
  },
];

const roomColumns: AdminTableColumn<AdminRoomSnapshot>[] = [
  { header: "Room", render: (room) => <span className="font-semibold text-slate-100">{room.name}</span> },
  {
    header: "Status",
    render: (room) => <AdminStatusBadge label={room.status} tone={moderationStatusTone(room.status)} />,
  },
  { header: "Rate", render: (room) => room.nightlyRate },
  { header: "Occupancy", render: (room) => room.occupancy },
  {
    header: "Flags",
    render: (room) => (
      <span className={room.flags > 3 ? "font-semibold text-red-200" : "text-slate-400"}>
        {room.flags}
      </span>
    ),
  },
];

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
    header: "Guest",
    render: (booking) => (
      <Link href={`/admin/users/${booking.userId}`} className="hover:text-blue-200">
        {booking.guestName}
      </Link>
    ),
  },
  { header: "Hotel", render: (booking) => booking.hotelName },
  {
    header: "Payment",
    render: (booking) => <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />,
  },
  { header: "Risk", render: (booking) => booking.riskSignal },
];

const reviewColumns: AdminTableColumn<AdminReviewCase>[] = [
  {
    header: "Reviewer",
    render: (review) => (
      <Link href={`/admin/users/${review.userId}`} className="hover:text-blue-200">
        {review.userName}
      </Link>
    ),
  },
  { header: "Hotel", render: (review) => review.hotelName },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  {
    header: "Status",
    render: (review) => <AdminStatusBadge label={review.status} tone={reviewStatusTone(review.status)} />,
  },
  { header: "Excerpt", render: (review) => review.excerpt },
];

const reportColumns: AdminTableColumn<AdminReport>[] = [
  { header: "Report", render: (report) => report.reason },
  { header: "Subject", render: (report) => report.subjectLabel },
  {
    header: "Severity",
    render: (report) => <AdminStatusBadge label={report.severity} tone={severityTone(report.severity)} />,
  },
  { header: "Status", render: (report) => report.status },
];

export default async function Page({ params }: AdminDetailPageProps) {
  const { id } = await params;
  const partner = adminPartners.find((item) => item.id === id) ?? adminPartners[0];
  const hotels = getAdminHotelsForPartner(partner.id);
  const hotelIds = getHotelIds(hotels);
  const bookings = adminBookings.filter((booking) => hotelIds.has(booking.hotelId));
  const reviews = adminReviews.filter((review) => hotelIds.has(review.hotelId));
  const reports = adminReports.filter((report) => report.type === "hotel" && hotelIds.has(report.subjectId));
  const rooms = adminRoomSnapshots.filter((room) => hotelIds.has(room.hotelId));

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Partner inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            {partner.companyName}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {partner.contactName} / {partner.email}
          </p>
        </div>
        <AdminActionMenu
          actions={[
            { label: "Partners", href: "/admin/partners", tone: "neutral" },
            { label: "Suspend", href: `/admin/partners/${partner.id}?action=suspend`, tone: "red" },
            { label: "Activate", href: `/admin/partners/${partner.id}?action=activate`, tone: "blue" },
            { label: "Hold payout", href: `/admin/partners/${partner.id}?action=hold-payout`, tone: "amber" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-6">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Account</p>
          <div className="mt-2">
            <AdminStatusBadge label={partner.status} tone={accountStatusTone(partner.status)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Verification</p>
          <div className="mt-2">
            <AdminStatusBadge label={partner.verificationStatus} tone={moderationStatusTone(partner.verificationStatus)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Hotels</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{hotels.length}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Rooms</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{sumRooms(hotels)}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Bookings</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{sumBookings(hotels)}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Flags</p>
          <p className="mt-2 text-sm font-semibold text-red-200">{sumFlags(hotels)}</p>
        </AdminPanel>
      </div>

      <AdminSection title="Partner account">
        <AdminPanel className="grid gap-4 p-4 text-xs leading-6 text-slate-400 md:grid-cols-3">
          <p>{partner.notes}</p>
          <p>Joined {partner.joinedAt}. Last active {partner.lastActive}. Risk score {partner.riskScore}.</p>
          <p>Payout status is {partner.payoutStatus}. Hotel-level actions stay nested under this partner account.</p>
        </AdminPanel>
      </AdminSection>

      <AdminSection title="Owned hotels" description="All hotel moderation actions are scoped to the owning partner.">
        <AdminTable rows={hotels} columns={hotelColumns} getRowKey={(hotel) => hotel.id} />
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Rooms">
          <AdminTable rows={rooms} columns={roomColumns} getRowKey={(room) => room.id} />
        </AdminSection>
        <AdminSection title="Bookings">
          <AdminTable rows={bookings} columns={bookingColumns} getRowKey={(booking) => booking.id} />
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <AdminSection title="Reviews">
          <AdminTable rows={reviews} columns={reviewColumns} getRowKey={(review) => review.id} />
        </AdminSection>
        <AdminSection title="Reports and moderation notes">
          <AdminTable rows={reports} columns={reportColumns} getRowKey={(report) => report.id} />
        </AdminSection>
      </div>
    </>
  );
}
