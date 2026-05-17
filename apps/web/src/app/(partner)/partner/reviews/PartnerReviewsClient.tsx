"use client";

import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  FunnelIcon,
  PencilSquareIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  PartnerReviewActionNotice,
  PartnerReviewListItem,
  PartnerReviewReplyPayload,
  PartnerReviewsClientProps,
} from "@/types/partner-review";

const ratingOptions = [
  { label: "All ratings", value: "all" },
  { label: "5 stars", value: "5" },
  { label: "4 stars", value: "4" },
  { label: "3 stars", value: "3" },
  { label: "2 stars", value: "2" },
  { label: "1 star", value: "1" },
] as const;

const moderationOptions = [
  { label: "All statuses", value: "all" },
  { label: "Published", value: "published" },
  { label: "Hidden", value: "hidden" },
] as const;

const replyOptions = [
  { label: "All replies", value: "all" },
  { label: "Replied", value: "replied" },
  { label: "Not replied", value: "not_replied" },
] as const;

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Highest rating", value: "highest_rating" },
  { label: "Lowest rating", value: "lowest_rating" },
] as const;

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function badgeTone(value: string): PartnerBadgeTone {
  if (value === "published" || value === "replied") return "emerald";
  if (value === "hidden") return "rose";
  if (value === "not_replied") return "amber";
  return "slate";
}

function buildReviewsPath(values: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (!value || value === "all") continue;
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/partner/reviews?${query}` : "/partner/reviews";
}

function updateReviewReply(
  reviews: PartnerReviewListItem[],
  updated: PartnerReviewListItem
) {
  return reviews.map((review) => (review.id === updated.id ? { ...review, ...updated } : review));
}

export default function PartnerReviewsClient({ initialResult }: PartnerReviewsClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialResult.reviews);
  const [hotelId, setHotelId] = useState(initialResult.filters.hotelId?.toString() ?? "all");
  const [rating, setRating] = useState(initialResult.filters.rating?.toString() ?? "all");
  const [moderationStatus, setModerationStatus] = useState(initialResult.filters.moderationStatus ?? "all");
  const [replyStatus, setReplyStatus] = useState(initialResult.filters.replyStatus ?? "all");
  const [dateFrom, setDateFrom] = useState(initialResult.filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialResult.filters.dateTo ?? "");
  const [sort, setSort] = useState(initialResult.filters.sort);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<number, string>>(() => (
    Object.fromEntries(initialResult.reviews.map((review) => [review.id, review.partnerReply ?? ""]))
  ));
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<PartnerReviewActionNotice | null>(null);

  const applyFilters = (page = "1") => {
    router.push(buildReviewsPath({
      hotelId,
      rating,
      moderationStatus,
      replyStatus,
      dateFrom,
      dateTo,
      sort,
      page,
      pageSize: String(initialResult.pagination.pageSize),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const pushQuickFilter = (values: Partial<Record<string, string>>) => {
    router.push(buildReviewsPath({
      hotelId,
      rating,
      moderationStatus,
      replyStatus,
      dateFrom,
      dateTo,
      sort,
      page: "1",
      pageSize: String(initialResult.pagination.pageSize),
      ...values,
    }));
  };

  const saveReply = async (reviewId: number) => {
    setSavingId(reviewId);
    setNotice(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerReply: draftReplies[reviewId] ?? "" }),
      });
      const payload = await response.json().catch(() => null) as PartnerReviewReplyPayload | null;

      if (!response.ok || !payload?.data) {
        setNotice({ tone: "error", message: payload?.error?.message ?? "Reply update failed." });
        return;
      }

      setReviews((items) => updateReviewReply(items, payload.data!));
      setNotice({ tone: "success", message: "Review reply saved." });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Reply update failed." });
    } finally {
      setSavingId(null);
    }
  };

  const goToPage = (page: number) => {
    applyFilters(String(page));
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pushQuickFilter({ replyStatus: "not_replied" })}
          className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
        >
          Unanswered
        </button>
        <button
          type="button"
          onClick={() => pushQuickFilter({ sort: "lowest_rating" })}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]"
        >
          Low ratings
        </button>
        <button
          type="button"
          onClick={() => pushQuickFilter({ sort: "newest" })}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]"
        >
          Newest
        </button>
      </div>

      <PartnerCard>
        <form className="grid gap-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]" onSubmit={handleSubmit}>
          <select value={hotelId} onChange={(event) => setHotelId(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            <option value="all">All hotels</option>
            {initialResult.hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
          <select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={moderationStatus} onChange={(event) => setModerationStatus(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            {moderationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={replyStatus} onChange={(event) => setReplyStatus(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
            {replyOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40" aria-label="Review date from" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40" aria-label="Review date to" />
          <div className="flex gap-2 lg:col-span-7">
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
              <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              Apply
            </button>
            <Link href="/partner/reviews" className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
              Reset
            </Link>
          </div>
        </form>
      </PartnerCard>

      {notice ? (
        <div className={["rounded-lg border px-4 py-3 text-sm font-medium", notice.tone === "success" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-rose-300/30 bg-rose-300/10 text-rose-100"].join(" ")}>
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-5">
        {reviews.map((review) => {
          const isSaving = savingId === review.id;
          const isExpanded = expandedId === review.id;

          return (
            <PartnerCard key={review.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">{review.guestFullName}</h2>
                    <PartnerBadge tone={badgeTone(review.partnerReplyStatus)}>
                      {review.partnerReplyStatus === "replied" ? "Replied" : "Unanswered"}
                    </PartnerBadge>
                    <PartnerBadge tone={badgeTone(review.moderationStatus)}>
                      {formatLabel(review.moderationStatus)}
                    </PartnerBadge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    #{review.id} - {review.hotelName} - {review.roomTypeName} - {formatDate(review.createdAt)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                  <StarIcon className="h-4 w-4" aria-hidden="true" />
                  {review.rating}
                </span>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {review.comment ?? "No written comment was provided."}
              </p>

              {isExpanded ? (
                <div className="mt-5 grid gap-4 rounded-lg border border-white/10 bg-slate-950/40 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guest</p>
                    <p className="mt-1 font-semibold text-white">{review.guestFullName}</p>
                    <p className="mt-1 break-all text-sm text-slate-400">{review.guestEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Booking</p>
                    <p className="mt-1 font-semibold text-white">#{review.bookingId}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(review.checkInDate)} - {formatDate(review.checkOutDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Hotel</p>
                    <p className="mt-1 font-semibold text-white">{review.hotelName}</p>
                    <p className="mt-1 text-sm text-slate-400">{review.hotelLocation}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <label className="grid gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                    Partner reply
                  </span>
                  <textarea
                    className="min-h-24 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300/60"
                    placeholder="Write a professional partner response..."
                    value={draftReplies[review.id] ?? ""}
                    onChange={(event) => setDraftReplies((current) => ({ ...current, [review.id]: event.target.value }))}
                  />
                </label>
                {review.partnerRepliedAt ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Last replied {formatDate(review.partnerRepliedAt)}
                    {review.partnerRepliedByName ? ` by ${review.partnerRepliedByName}` : ""}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : review.id)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                    <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    {isExpanded ? "Hide details" : "View review"}
                  </button>
                  <button type="button" onClick={() => void saveReply(review.id)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60">
                    {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />}
                    {review.partnerReplyStatus === "replied" ? "Edit reply" : "Reply"}
                  </button>
                </div>
              </div>
            </PartnerCard>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <PartnerCard>
          <div className="py-8 text-center">
            <p className="font-semibold text-white">No reviews found</p>
            <p className="mt-2 text-sm text-slate-400">Adjust filters to inspect another review set.</p>
          </div>
        </PartnerCard>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {initialResult.pagination.page} of {initialResult.pagination.totalPages} - {initialResult.pagination.totalItems} review{initialResult.pagination.totalItems === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={() => goToPage(initialResult.pagination.page - 1)} disabled={initialResult.pagination.page <= 1} className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40">
            Previous
          </button>
          <button type="button" onClick={() => goToPage(initialResult.pagination.page + 1)} disabled={initialResult.pagination.page >= initialResult.pagination.totalPages} className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </>
  );
}
