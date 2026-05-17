"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { reviewModerationStatusTone } from "@/lib/admin-display";
import type { AdminReviewDetailClientProps } from "@/types/admin-reviews";
import type { ReviewModerationStatus } from "@/types/review";

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function displayValue(value: string | null): string {
  return value?.trim() || "Not set";
}

export default function AdminReviewDetailClient({ review }: AdminReviewDetailClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(moderationStatus: ReviewModerationStatus) {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderationStatus }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "Review update failed.");
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
            Review inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Review #{review.id}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {review.hotelName} / {review.rating} out of 5
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Reviews", href: "/admin/reviews", tone: "neutral" }]} />
          <AdminActionButton
            tone="blue"
            disabled={pending || review.moderationStatus === "published"}
            onClick={() => updateStatus("published")}
          >
            Publish
          </AdminActionButton>
          <AdminActionButton
            tone="red"
            disabled={pending || review.moderationStatus === "hidden"}
            onClick={() => updateStatus("hidden")}
          >
            Hide
          </AdminActionButton>
        </div>
      </div>

      {error ? <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Moderation</p>
          <div className="mt-2"><AdminStatusBadge label={review.moderationStatus} tone={reviewModerationStatusTone(review.moderationStatus)} /></div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Rating</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{review.rating}/5</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Reply</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{review.partnerReply ? "Replied" : "Not replied"}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Created</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{formatDate(review.createdAt)}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Updated</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{formatDate(review.updatedAt)}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminSection title="Guest">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Name: <Link href={`/admin/users/${review.userId}`} className="font-semibold text-blue-200 hover:text-blue-100">{review.guestFullName}</Link></p>
            <p>Email: <span className="text-slate-200">{review.guestEmail}</span></p>
            <p>Phone: <span className="text-slate-200">{displayValue(review.guestPhone)}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Hotel and partner">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Hotel: <span className="text-slate-200">{review.hotelName}</span></p>
            <p>Location: <span className="text-slate-200">{review.hotelLocation}</span></p>
            <p>Partner: <Link href={`/admin/partners/${review.partnerId}`} className="font-semibold text-blue-200 hover:text-blue-100">{review.partnerCompanyName}</Link></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Booking">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Booking: <Link href={`/admin/bookings/${review.bookingId}`} className="font-semibold text-blue-200 hover:text-blue-100">#{review.bookingId}</Link></p>
            <p>Room type: <span className="text-slate-200">{review.roomTypeName}</span></p>
            <p>Stay: <span className="text-slate-200">{review.checkInDate} to {review.checkOutDate}</span></p>
            <p>Status: <span className="text-slate-200">{displayValue(review.bookingStatus)}</span></p>
            <p>Payment: <span className="text-slate-200">{displayValue(review.paymentStatus)} / {displayValue(review.paymentMethod)}</span></p>
          </AdminPanel>
        </AdminSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSection title="Customer comment">
          <AdminPanel className="min-h-32 whitespace-pre-wrap p-4 text-sm leading-7 text-slate-300">
            {displayValue(review.comment)}
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Partner reply" description="Moderation keeps partner replies intact.">
          <AdminPanel className="min-h-32 whitespace-pre-wrap p-4 text-sm leading-7 text-slate-300">
            {displayValue(review.partnerReply)}
          </AdminPanel>
        </AdminSection>
      </div>
    </>
  );
}
