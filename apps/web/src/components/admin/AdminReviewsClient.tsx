"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { reviewModerationStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminReviewFilters,
  AdminReviewListItem,
  AdminReviewsClientProps,
} from "@/types/admin-reviews";
import type { ReviewModerationStatus } from "@/types/review";

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function commentPreview(comment: string | null): string {
  const value = comment?.trim() || "No comment provided.";
  return value.length <= 120 ? value : `${value.slice(0, 117).trimEnd()}...`;
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (text && text !== "all") params.set(key, text);
}

function reviewsHref(filters: AdminReviewFilters, updates: Partial<AdminReviewFilters>) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.hotelId) params.set("hotelId", String(next.hotelId));
  if (next.partnerId) params.set("partnerId", next.partnerId);
  if (next.rating) params.set("rating", String(next.rating));
  if (next.moderationStatus) params.set("moderationStatus", next.moderationStatus);
  if (next.replyStatus) params.set("replyStatus", next.replyStatus);
  if (next.dateFrom) params.set("dateFrom", next.dateFrom);
  if (next.dateTo) params.set("dateTo", next.dateTo);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

export default function AdminReviewsClient({ result }: AdminReviewsClientProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderateReview(reviewId: number, moderationStatus: ReviewModerationStatus) {
    setPendingId(reviewId);
    setError(null);

    const response = await fetch(`/api/reviews/${reviewId}`, {
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

    setPendingId(null);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    setParam(params, "hotelId", form.get("hotelId"));
    setParam(params, "partnerId", form.get("partnerId"));
    setParam(params, "rating", form.get("rating"));
    setParam(params, "moderationStatus", form.get("moderationStatus"));
    setParam(params, "replyStatus", form.get("replyStatus"));
    setParam(params, "dateFrom", form.get("dateFrom"));
    setParam(params, "dateTo", form.get("dateTo"));
    setParam(params, "sort", form.get("sort"));
    setParam(params, "pageSize", form.get("pageSize"));

    const query = params.toString();
    router.push(query ? `/admin/reviews?${query}` : "/admin/reviews");
  }

  const columns: AdminTableColumn<AdminReviewListItem>[] = [
    {
      header: "Review",
      render: (review) => (
        <div>
          <Link href={`/admin/reviews/${review.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
            #{review.id}
          </Link>
          <p className="mt-1 line-clamp-2 text-slate-500">{commentPreview(review.comment)}</p>
          <p className="mt-1 text-slate-600">{formatDate(review.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Guest",
      render: (review) => (
        <Link href={`/admin/users/${review.userId}`} className="hover:text-blue-200">
          {review.guestFullName}
          <span className="mt-1 block text-slate-500">{review.guestEmail}</span>
        </Link>
      ),
    },
    {
      header: "Hotel / partner",
      render: (review) => (
        <div>
          <span className="font-semibold text-slate-100">{review.hotelName}</span>
          <p className="mt-1 text-slate-500">{review.partnerCompanyName}</p>
          <p className="mt-1 text-slate-500">{review.roomTypeName}</p>
        </div>
      ),
    },
    { header: "Rating", render: (review) => `${review.rating}/5` },
    {
      header: "Moderation",
      render: (review) => <AdminStatusBadge label={review.moderationStatus} tone={reviewModerationStatusTone(review.moderationStatus)} />,
    },
    {
      header: "Reply",
      render: (review) => (
        <span className={review.partnerReply ? "text-blue-200" : "text-slate-500"}>
          {review.partnerReply ? "Replied" : "Not replied"}
        </span>
      ),
    },
    { header: "Updated", render: (review) => formatDate(review.updatedAt) },
    {
      header: "Actions",
      render: (review) => (
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Inspect", href: `/admin/reviews/${review.id}`, tone: "blue" }]} />
          <AdminActionButton
            tone="blue"
            disabled={pendingId === review.id || review.moderationStatus === "published"}
            onClick={() => moderateReview(review.id, "published")}
          >
            Publish
          </AdminActionButton>
          <AdminActionButton
            tone="red"
            disabled={pendingId === review.id || review.moderationStatus === "hidden"}
            onClick={() => moderateReview(review.id, "hidden")}
          >
            Hide
          </AdminActionButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminFilters
        filters={[
          { label: "All", href: "/admin/reviews", active: !result.filters.moderationStatus && !result.filters.replyStatus, count: result.counts.total },
          { label: "Published", href: reviewsHref(result.filters, { moderationStatus: "published", page: 1 }), active: result.filters.moderationStatus === "published", count: result.counts.published, tone: "blue" },
          { label: "Hidden", href: reviewsHref(result.filters, { moderationStatus: "hidden", page: 1 }), active: result.filters.moderationStatus === "hidden", count: result.counts.hidden, tone: "red" },
          { label: "Replied", href: reviewsHref(result.filters, { replyStatus: "replied", page: 1 }), active: result.filters.replyStatus === "replied", count: result.counts.replied, tone: "blue" },
          { label: "Not replied", href: reviewsHref(result.filters, { replyStatus: "not_replied", page: 1 }), active: result.filters.replyStatus === "not_replied", count: result.counts.notReplied, tone: "amber" },
        ]}
      />

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-3 xl:grid-cols-7">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Hotel
          <select name="hotelId" defaultValue={result.filters.hotelId ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {result.hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Partner
          <select name="partnerId" defaultValue={result.filters.partnerId ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {result.partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Rating
          <select name="rating" defaultValue={result.filters.rating ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Status
          <select name="moderationStatus" defaultValue={result.filters.moderationStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Reply
          <select name="replyStatus" defaultValue={result.filters.replyStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            <option value="replied">Replied</option>
            <option value="not_replied">Not replied</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          From
          <input name="dateFrom" type="date" defaultValue={result.filters.dateFrom ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          To
          <input name="dateTo" type="date" defaultValue={result.filters.dateTo ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Sort
          <select name="sort" defaultValue={result.filters.sort} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_rating">Highest rating</option>
            <option value="lowest_rating">Lowest rating</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Page size
          <select name="pageSize" defaultValue={result.filters.pageSize} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="h-9 rounded-[3px] border border-blue-500/40 px-3 text-xs font-semibold uppercase tracking-wide text-blue-200 transition hover:bg-blue-500/10">
            Apply
          </button>
          <Link href="/admin/reviews" className="inline-flex h-9 items-center rounded-[3px] border border-slate-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900">
            Reset
          </Link>
        </div>
      </form>

      {error ? <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div> : null}

      <AdminSection title="Moderation queue" description="Database-backed reviews across all hotels with moderation and partner reply state.">
        <AdminTable
          rows={result.reviews}
          columns={columns}
          getRowKey={(review) => String(review.id)}
          emptyState={<AdminEmptyState title="No reviews found" description="Adjust filters to broaden the review search." />}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>Page {result.pagination.page} of {result.pagination.totalPages} / {result.pagination.totalItems} reviews</span>
        <div className="flex items-center gap-2">
          <Link href={reviewsHref(result.filters, { page: Math.max(1, result.pagination.page - 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Previous
          </Link>
          <Link href={reviewsHref(result.filters, { page: Math.min(result.pagination.totalPages, result.pagination.page + 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
