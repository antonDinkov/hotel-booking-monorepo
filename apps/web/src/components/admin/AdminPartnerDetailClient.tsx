"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { activeStatusTone, verificationStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminPartnerBookingSummary,
  AdminPartnerDetailClientProps,
  AdminPartnerHotelSummary,
  AdminPartnerReviewSummary,
  AdminPartnerVerificationStatus,
} from "@/types/admin-partners";

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

const actionOptions: Array<{
  label: string;
  status: AdminPartnerVerificationStatus;
  tone: "blue" | "amber" | "red" | "neutral";
}> = [
  { label: "Pending", status: "pending", tone: "amber" },
  { label: "Approve", status: "verified", tone: "blue" },
  { label: "Reject", status: "rejected", tone: "red" },
  { label: "Suspend", status: "suspended", tone: "red" },
];

const hotelColumns: AdminTableColumn<AdminPartnerHotelSummary>[] = [
  {
    header: "Hotel",
    render: (hotel) => (
      <div>
        <span className="font-semibold text-slate-100">{hotel.name}</span>
        <p className="mt-1 text-slate-500">{hotel.location}</p>
      </div>
    ),
  },
  { header: "Bookings", render: (hotel) => hotel.bookingsCount },
  { header: "Reviews", render: (hotel) => hotel.reviewsCount },
  { header: "Registered", render: (hotel) => formatDate(hotel.registeredAt) },
];

const bookingColumns: AdminTableColumn<AdminPartnerBookingSummary>[] = [
  {
    header: "Booking",
    render: (booking) => (
      <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
        #{booking.id}
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
  { header: "Dates", render: (booking) => `${booking.checkInDate} to ${booking.checkOutDate}` },
  { header: "Payment", render: (booking) => booking.paymentStatus ?? "pending" },
];

const reviewColumns: AdminTableColumn<AdminPartnerReviewSummary>[] = [
  {
    header: "Reviewer",
    render: (review) => (
      <Link href={`/admin/users/${review.userId}`} className="hover:text-blue-200">
        {review.reviewerName}
      </Link>
    ),
  },
  { header: "Hotel", render: (review) => review.hotelName ?? "Unknown hotel" },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  { header: "Status", render: (review) => review.moderationStatus },
  { header: "Excerpt", render: (review) => <span className="line-clamp-2">{review.commentPreview}</span> },
];

export default function AdminPartnerDetailClient({
  partner,
}: AdminPartnerDetailClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(verificationStatus: AdminPartnerVerificationStatus) {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/partners/${partner.partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "Partner update failed.");
    } else {
      router.refresh();
    }

    setPending(false);
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Partner inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            {partner.partner.companyName}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {partner.partner.representativeName} / {partner.partner.email}
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{partner.partner.id}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Partners", href: "/admin/partners", tone: "neutral" }]} />
          {actionOptions.map((action) => (
            <AdminActionButton
              key={action.status}
              tone={action.tone}
              disabled={pending || partner.partner.verificationStatus === action.status}
              onClick={() => updateStatus(action.status)}
            >
              {action.label}
            </AdminActionButton>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-6">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Verification</p>
          <div className="mt-2">
            <AdminStatusBadge label={partner.partner.verificationStatus} tone={verificationStatusTone(partner.partner.verificationStatus)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">isVerified</p>
          <div className="mt-2">
            <AdminStatusBadge label={partner.partner.isVerified ? "true" : "false"} tone={partner.partner.isVerified ? "blue" : "red"} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Hotels</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{partner.partner.hotelsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Bookings</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{partner.partner.bookingsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Reviews</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{partner.partner.reviewsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Created</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{formatDate(partner.partner.createdAt)}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminSection title="Company details">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Company: <span className="text-slate-200">{partner.partner.companyName}</span></p>
            <p>Email: <span className="text-slate-200">{partner.partner.email}</span></p>
            <p>Phone: <span className="text-slate-200">{partner.partner.phone ?? "Not set"}</span></p>
            <p>Website: <span className="text-slate-200">{partner.partner.website ?? "Not set"}</span></p>
            <p>Address: <span className="text-slate-200">{partner.partner.companyAddress ?? "Not set"}</span></p>
            <p>VAT: <span className="text-slate-200">{partner.partner.vatNumber ?? "Not set"}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Representative">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Name: <span className="text-slate-200">{partner.partner.representativeName}</span></p>
            <p>First name: <span className="text-slate-200">{partner.partner.representativeFirstName}</span></p>
            <p>Last name: <span className="text-slate-200">{partner.partner.representativeLastName}</span></p>
            <p>Position: <span className="text-slate-200">{partner.partner.position}</span></p>
            <p>Updated: <span className="text-slate-200">{formatDate(partner.partner.updatedAt)}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Linked user account">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>
              Account:{" "}
              <Link href={`/admin/users/${partner.linkedUser.id}`} className="font-semibold text-blue-200 hover:text-blue-100">
                {partner.linkedUser.email}
              </Link>
            </p>
            <p>Name: <span className="text-slate-200">{partner.linkedUser.fullName ?? "Not set"}</span></p>
            <p>Phone: <span className="text-slate-200">{partner.linkedUser.phone ?? "Not set"}</span></p>
            <p>Status: <AdminStatusBadge label={partner.linkedUser.isActive ? "active" : "inactive"} tone={activeStatusTone(partner.linkedUser.isActive)} /></p>
            <p>Created: <span className="text-slate-200">{formatDate(partner.linkedUser.createdAt)}</span></p>
          </AdminPanel>
        </AdminSection>
      </div>

      <AdminSection title="Partner hotels" description="Hotels linked to this partner profile.">
        <AdminTable
          rows={partner.hotels}
          columns={hotelColumns}
          getRowKey={(hotel) => String(hotel.id)}
          emptyState={
            <AdminEmptyState
              title="No hotels found"
              description="This partner does not have linked hotels yet."
            />
          }
        />
      </AdminSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Bookings summary">
          <AdminTable
            rows={partner.bookings}
            columns={bookingColumns}
            getRowKey={(booking) => String(booking.id)}
            emptyState={
              <AdminEmptyState
                title="No bookings found"
                description="This partner does not have recent booking activity."
              />
            }
          />
        </AdminSection>
        <AdminSection title="Reviews summary">
          <AdminTable
            rows={partner.reviews}
            columns={reviewColumns}
            getRowKey={(review) => String(review.id)}
            emptyState={
              <AdminEmptyState
                title="No reviews found"
                description="This partner does not have recent review activity."
              />
            }
          />
        </AdminSection>
      </div>
    </>
  );
}
