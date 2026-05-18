"use client";

import {
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  PartnerBookingActionNotice,
  PartnerBookingsClientProps,
  PartnerBookingStatus,
  PartnerBookingStatusFilter,
  PartnerBookingStatusUpdatePayload,
} from "@/types/partner-booking";

const statusOptions: Array<{ label: string; value: PartnerBookingStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const paymentOptions = [
  { label: "All payments", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refund pending", value: "refund_pending" },
  { label: "Refunded", value: "refunded" },
  { label: "Refund denied", value: "refund_denied" },
] as const;

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Check-in date", value: "check_in" },
  { label: "Check-out date", value: "check_out" },
] as const;

function statusTone(status: string): PartnerBadgeTone {
  if (status === "confirmed" || status === "completed") return "emerald";
  if (status === "cancelled") return "rose";
  if (status === "pending") return "amber";
  return "slate";
}

function paymentTone(status: string): PartnerBadgeTone {
  if (status === "paid" || status === "refunded") return "emerald";
  if (status === "pending" || status === "refund_pending") return "amber";
  if (status === "failed" || status === "cancelled" || status === "refund_denied") return "rose";
  return "slate";
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(value);
}

function buildBookingsPath(values: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (!value || value === "all") continue;
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/partner/bookings?${query}` : "/partner/bookings";
}

export default function PartnerBookingsClient({ initialResult }: PartnerBookingsClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialResult.bookings);
  const [status, setStatus] = useState<PartnerBookingStatusFilter>(initialResult.filters.status ?? "all");
  const [paymentStatus, setPaymentStatus] = useState(initialResult.filters.paymentStatus ?? "all");
  const [hotelId, setHotelId] = useState(initialResult.filters.hotelId?.toString() ?? "all");
  const [dateFrom, setDateFrom] = useState(initialResult.filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialResult.filters.dateTo ?? "");
  const [sort, setSort] = useState(initialResult.filters.sort);
  const [draftStatuses, setDraftStatuses] = useState<Record<number, PartnerBookingStatus>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<PartnerBookingActionNotice | null>(null);

  useEffect(() => {
    setBookings(initialResult.bookings);
    setStatus(initialResult.filters.status ?? "all");
    setPaymentStatus(initialResult.filters.paymentStatus ?? "all");
    setHotelId(initialResult.filters.hotelId?.toString() ?? "all");
    setDateFrom(initialResult.filters.dateFrom ?? "");
    setDateTo(initialResult.filters.dateTo ?? "");
    setSort(initialResult.filters.sort);
    setDraftStatuses({});
  }, [initialResult]);

  const applyFilters = (page = "1") => {
    router.push(buildBookingsPath({
      status,
      paymentStatus,
      hotelId,
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

  const handleStatusFilter = (value: PartnerBookingStatusFilter) => {
    setStatus(value);
    router.push(buildBookingsPath({
      status: value,
      paymentStatus,
      hotelId,
      dateFrom,
      dateTo,
      sort,
      page: "1",
      pageSize: String(initialResult.pagination.pageSize),
    }));
  };

  const handleUpdateStatus = async (bookingId: number, nextStatus: PartnerBookingStatus) => {
    setUpdatingId(bookingId);
    setNotice(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => null) as PartnerBookingStatusUpdatePayload | null;

      if (!response.ok || !payload?.data) {
        setNotice({ tone: "error", message: payload?.error?.message ?? "Status update failed." });
        return;
      }

      setBookings((items) => items.map((item) => (
        item.id === bookingId
          ? {
              ...item,
              status: payload.data!.status,
              paymentMethod: payload.data!.paymentMethod ?? item.paymentMethod,
              paymentStatus: payload.data!.paymentStatus ?? item.paymentStatus,
            }
          : item
      )));
      setNotice({
        tone: "success",
        message: payload.data.notification?.message ?? "Booking status updated.",
      });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Status update failed." });
    } finally {
      setUpdatingId(null);
    }
  };

  const goToPage = (page: number) => {
    applyFilters(String(page));
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleStatusFilter(option.value)}
            className={[
              "rounded-lg border px-4 py-2 text-sm font-semibold transition",
              status === option.value
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 text-slate-300 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      <PartnerCard>
        <form className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]" onSubmit={handleSubmit}>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
          >
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={hotelId}
            onChange={(event) => setHotelId(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
          >
            <option value="all">All hotels</option>
            {initialResult.hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
            aria-label="Check-in date from"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
            aria-label="Check-in date to"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              Apply
            </button>
            <Link
              href="/partner/bookings"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              Reset
            </Link>
          </div>
        </form>
      </PartnerCard>

      {notice ? (
        <div
          className={[
            "rounded-lg border px-4 py-3 text-sm font-medium",
            notice.tone === "success"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/30 bg-rose-300/10 text-rose-100",
          ].join(" ")}
        >
          {notice.message}
        </div>
      ) : null}

      <PartnerCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Booking</th>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Hotel / room</th>
                <th className="px-4 py-3 font-semibold">Stay</th>
                <th className="px-4 py-3 font-semibold">Guests</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {bookings.map((booking) => {
                const selectedStatus = draftStatuses[booking.id] ?? booking.status;
                const isUpdating = updatingId === booking.id;

                return (
                  <tr key={booking.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-semibold text-white">#{booking.id}</td>
                    <td className="px-4 py-4 font-medium text-white">{booking.guestFullName}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-200">{booking.hotelName}</p>
                      <p className="mt-1 text-slate-500">{booking.roomTypeName}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      <p>{formatDate(booking.checkInDate)}</p>
                      <p className="mt-1">{formatDate(booking.checkOutDate)}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {booking.guestsCount} guest{booking.guestsCount === 1 ? "" : "s"}
                      <p className="mt-1 text-slate-500">
                        {booking.roomsCount} room{booking.roomsCount === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <PartnerBadge tone={paymentTone(booking.paymentStatus)}>
                        {formatLabel(booking.paymentStatus)}
                      </PartnerBadge>
                    </td>
                    <td className="px-4 py-4">
                      <PartnerBadge tone={statusTone(booking.status)}>
                        {formatLabel(booking.status)}
                      </PartnerBadge>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-100">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(booking.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[260px] flex-wrap items-center gap-2">
                        <Link
                          href={`/partner/bookings/${booking.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                        >
                          <EyeIcon className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                        <select
                          value={selectedStatus}
                          onChange={(event) => {
                            setDraftStatuses((current) => ({
                              ...current,
                              [booking.id]: event.target.value as PartnerBookingStatus,
                            }));
                          }}
                          className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
                          aria-label={`Status for booking ${booking.id}`}
                        >
                          {statusOptions.slice(1).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(booking.id, selectedStatus)}
                          disabled={isUpdating || selectedStatus === booking.status}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/25 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ArrowPathIcon className={["h-4 w-4", isUpdating ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-semibold text-white">No bookings found</p>
            <p className="mt-2 text-sm text-slate-400">Adjust the filters to review another booking range.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {initialResult.pagination.page} of {initialResult.pagination.totalPages} - {initialResult.pagination.totalItems} booking{initialResult.pagination.totalItems === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(initialResult.pagination.page - 1)}
              disabled={initialResult.pagination.page <= 1}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage(initialResult.pagination.page + 1)}
              disabled={initialResult.pagination.page >= initialResult.pagination.totalPages}
              className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </PartnerCard>
    </>
  );
}
