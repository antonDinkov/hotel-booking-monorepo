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
  AdminUserBookingSummary,
  AdminUserDetailClientProps,
  AdminUserReviewSummary,
} from "@/types/admin-users";

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function accountName(fullName: string | null, email: string): string {
  return fullName?.trim() || email.split("@")[0] || email;
}

const bookingColumns: AdminTableColumn<AdminUserBookingSummary>[] = [
  {
    header: "Booking",
    render: (booking) => (
      <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
        #{booking.id}
      </Link>
    ),
  },
  { header: "Hotel", render: (booking) => booking.hotelName ?? "Unknown hotel" },
  { header: "Room", render: (booking) => booking.roomTypeName ?? "Room" },
  { header: "Dates", render: (booking) => `${booking.checkInDate} to ${booking.checkOutDate}` },
  { header: "Status", render: (booking) => booking.status ?? "pending" },
  { header: "Payment", render: (booking) => booking.paymentStatus ?? "pending" },
];

const reviewColumns: AdminTableColumn<AdminUserReviewSummary>[] = [
  {
    header: "Review",
    render: (review) => <span className="line-clamp-2 text-slate-300">{review.commentPreview}</span>,
  },
  { header: "Hotel", render: (review) => review.hotelName ?? "Unknown hotel" },
  { header: "Rating", render: (review) => `${review.rating}/5` },
  { header: "Status", render: (review) => review.moderationStatus },
  { header: "Created", render: (review) => formatDate(review.createdAt) },
];

export default function AdminUserDetailClient({ user }: AdminUserDetailClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = user.account;

  async function updateStatus(isActive: boolean) {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/users/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "User update failed.");
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
            Account inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            {accountName(account.fullName, account.email)}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{account.email}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">{account.id}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Users", href: "/admin/users", tone: "neutral" }]} />
          <AdminActionButton
            tone={account.isActive ? "red" : "blue"}
            disabled={pending}
            onClick={() => updateStatus(!account.isActive)}
          >
            {account.isActive ? "Deactivate" : "Activate"}
          </AdminActionButton>
        </div>
      </div>

      {error ? (
        <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Status</p>
          <div className="mt-2">
            <AdminStatusBadge label={account.isActive ? "active" : "inactive"} tone={activeStatusTone(account.isActive)} />
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Roles</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {account.roles.map((role) => <AdminStatusBadge key={role} label={role} tone={role === "admin" ? "red" : "neutral"} />)}
          </div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Bookings</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{account.bookingsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Reviews</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{account.reviewsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Joined</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{formatDate(account.createdAt)}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Account info">
          <AdminPanel className="grid gap-3 p-4 text-xs leading-6 text-slate-400 md:grid-cols-2">
            <p>Email: <span className="text-slate-200">{account.email}</span></p>
            <p>Phone: <span className="text-slate-200">{account.phone ?? "Not set"}</span></p>
            <p>Created: <span className="text-slate-200">{formatDate(account.createdAt)}</span></p>
            <p>User ID: <span className="font-mono text-slate-300">{account.id}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Profile info">
          <AdminPanel className="grid gap-3 p-4 text-xs leading-6 text-slate-400 md:grid-cols-2">
            <p>Full name: <span className="text-slate-200">{user.profile.fullName ?? "Not set"}</span></p>
            <p>Phone: <span className="text-slate-200">{user.profile.phone ?? "Not set"}</span></p>
            <p>Nationality: <span className="text-slate-200">{user.profile.nationality ?? "Not set"}</span></p>
            <p>Date of birth: <span className="text-slate-200">{user.profile.dateOfBirth ?? "Not set"}</span></p>
            <p>Gender: <span className="text-slate-200">{user.profile.gender ?? "Not set"}</span></p>
            <p>Location: <span className="text-slate-200">{[user.profile.city, user.profile.country].filter(Boolean).join(", ") || "Not set"}</span></p>
          </AdminPanel>
        </AdminSection>
      </div>

      {user.partnerProfile ? (
        <AdminSection title="Partner profile">
          <AdminPanel className="grid gap-4 p-4 text-xs leading-6 text-slate-400 md:grid-cols-4">
            <p>
              Company<br />
              <Link href={`/admin/partners/${user.partnerProfile.id}`} className="font-semibold text-blue-200 hover:text-blue-100">
                {user.partnerProfile.companyName}
              </Link>
            </p>
            <p>Representative<br /><span className="text-slate-200">{user.partnerProfile.representativeName}</span></p>
            <p>Verification<br /><AdminStatusBadge label={user.partnerProfile.verificationStatus} tone={verificationStatusTone(user.partnerProfile.verificationStatus)} /></p>
            <p>Portfolio<br /><span className="text-slate-200">{user.partnerProfile.hotelsCount} hotels / {user.partnerProfile.bookingsCount} bookings / {user.partnerProfile.reviewsCount} reviews</span></p>
          </AdminPanel>
        </AdminSection>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Bookings summary">
          <AdminTable
            rows={user.bookings}
            columns={bookingColumns}
            getRowKey={(booking) => String(booking.id)}
            emptyState={
              <AdminEmptyState
                title="No bookings found"
                description="This user does not have recent booking activity."
              />
            }
          />
        </AdminSection>
        <AdminSection title="Reviews summary">
          <AdminTable
            rows={user.reviews}
            columns={reviewColumns}
            getRowKey={(review) => String(review.id)}
            emptyState={
              <AdminEmptyState
                title="No reviews found"
                description="This user does not have recent review activity."
              />
            }
          />
        </AdminSection>
      </div>
    </>
  );
}
