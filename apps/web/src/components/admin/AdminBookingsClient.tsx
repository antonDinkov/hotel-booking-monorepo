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
import { bookingStatusTone, paymentStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type {
  AdminBookingFilters,
  AdminBookingListItem,
  AdminBookingsClientProps,
  AdminBookingStatus,
} from "@/types/admin-bookings";

const statusOptions: Array<{ label: string; value: AdminBookingStatus; tone: "blue" | "amber" | "red" }> = [
  { label: "Pending", value: "pending", tone: "amber" },
  { label: "Confirm", value: "confirmed", tone: "blue" },
  { label: "Complete", value: "completed", tone: "blue" },
  { label: "Cancel", value: "cancelled", tone: "red" },
];

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (text && text !== "all") params.set(key, text);
}

function bookingsHref(filters: AdminBookingFilters, updates: Partial<AdminBookingFilters>) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.status) params.set("status", next.status);
  if (next.paymentStatus) params.set("paymentStatus", next.paymentStatus);
  if (next.hotelId) params.set("hotelId", String(next.hotelId));
  if (next.partnerId) params.set("partnerId", next.partnerId);
  if (next.guestSearch) params.set("guestSearch", next.guestSearch);
  if (next.dateFrom) params.set("dateFrom", next.dateFrom);
  if (next.dateTo) params.set("dateTo", next.dateTo);
  if (next.createdFrom) params.set("createdFrom", next.createdFrom);
  if (next.createdTo) params.set("createdTo", next.createdTo);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

export default function AdminBookingsClient({ result }: AdminBookingsClientProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(bookingId: number, status: AdminBookingStatus) {
    setPendingId(bookingId);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? "Booking update failed.");
    } else {
      router.refresh();
    }

    setPendingId(null);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    setParam(params, "guestSearch", form.get("guestSearch"));
    setParam(params, "status", form.get("status"));
    setParam(params, "paymentStatus", form.get("paymentStatus"));
    setParam(params, "hotelId", form.get("hotelId"));
    setParam(params, "partnerId", form.get("partnerId"));
    setParam(params, "dateFrom", form.get("dateFrom"));
    setParam(params, "dateTo", form.get("dateTo"));
    setParam(params, "createdFrom", form.get("createdFrom"));
    setParam(params, "createdTo", form.get("createdTo"));
    setParam(params, "sort", form.get("sort"));
    setParam(params, "pageSize", form.get("pageSize"));

    const query = params.toString();
    router.push(query ? `/admin/bookings?${query}` : "/admin/bookings");
  }

  const columns: AdminTableColumn<AdminBookingListItem>[] = [
    {
      header: "Booking",
      render: (booking) => (
        <div>
          <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-slate-100 hover:text-blue-200">
            #{booking.id}
          </Link>
          <p className="mt-1 text-slate-500">{booking.checkInDate} to {booking.checkOutDate}</p>
          <p className="mt-1 text-slate-500">{booking.nights} nights / {booking.roomsCount} rooms</p>
        </div>
      ),
    },
    {
      header: "Guest",
      render: (booking) => (
        <Link href={`/admin/users/${booking.guestUserId}`} className="hover:text-blue-200">
          {booking.guestFullName}
          <span className="mt-1 block text-slate-500">{booking.guestEmail}</span>
        </Link>
      ),
    },
    {
      header: "Hotel / partner",
      render: (booking) => (
        <div>
          <span className="font-semibold text-slate-100">{booking.hotelName}</span>
          <p className="mt-1 text-slate-500">{booking.partnerCompanyName}</p>
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
      render: (booking) => (
        <div className="space-y-1">
          <AdminStatusBadge label={booking.paymentStatus} tone={paymentStatusTone(booking.paymentStatus)} />
          <p className="text-slate-500">{booking.paymentMethod ?? "Not selected"}</p>
        </div>
      ),
    },
    { header: "Guests", render: (booking) => booking.guestsCount },
    { header: "Total", render: (booking) => formatCurrency(booking.totalPrice) },
    { header: "Created", render: (booking) => formatDate(booking.createdAt) },
    {
      header: "Actions",
      render: (booking) => (
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Inspect", href: `/admin/bookings/${booking.id}`, tone: "blue" }]} />
          {statusOptions.map((action) => (
            <AdminActionButton
              key={action.value}
              tone={action.tone}
              disabled={pendingId === booking.id || booking.status === action.value}
              onClick={() => updateStatus(booking.id, action.value)}
            >
              {action.label}
            </AdminActionButton>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminFilters
        filters={[
          { label: "All", href: "/admin/bookings", active: !result.filters.status && !result.filters.paymentStatus, count: result.counts.total },
          { label: "Pending", href: bookingsHref(result.filters, { status: "pending", page: 1 }), active: result.filters.status === "pending", count: result.counts.pending, tone: "amber" },
          { label: "Confirmed", href: bookingsHref(result.filters, { status: "confirmed", page: 1 }), active: result.filters.status === "confirmed", count: result.counts.confirmed, tone: "blue" },
          { label: "Completed", href: bookingsHref(result.filters, { status: "completed", page: 1 }), active: result.filters.status === "completed", count: result.counts.completed, tone: "blue" },
          { label: "Cancelled", href: bookingsHref(result.filters, { status: "cancelled", page: 1 }), active: result.filters.status === "cancelled", count: result.counts.cancelled, tone: "red" },
          { label: "Paid", href: bookingsHref(result.filters, { paymentStatus: "paid", page: 1 }), active: result.filters.paymentStatus === "paid", count: result.counts.paid, tone: "blue" },
          { label: "Payment pending", href: bookingsHref(result.filters, { paymentStatus: "pending", page: 1 }), active: result.filters.paymentStatus === "pending", count: result.counts.paymentPending, tone: "amber" },
        ]}
      />

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 xl:col-span-2">
          Guest search
          <input name="guestSearch" type="search" defaultValue={result.filters.guestSearch ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Status
          <select name="status" defaultValue={result.filters.status ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {["pending", "confirmed", "cancelled", "completed", "expired"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Payment
          <select name="paymentStatus" defaultValue={result.filters.paymentStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
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
          Stay from
          <input name="dateFrom" type="date" defaultValue={result.filters.dateFrom ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Stay to
          <input name="dateTo" type="date" defaultValue={result.filters.dateTo ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Created from
          <input name="createdFrom" type="date" defaultValue={result.filters.createdFrom ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Created to
          <input name="createdTo" type="date" defaultValue={result.filters.createdTo ?? ""} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Sort
          <select name="sort" defaultValue={result.filters.sort} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="newest">Newest</option>
            <option value="check_in">Check-in</option>
            <option value="check_out">Check-out</option>
            <option value="total_price">Total price</option>
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
          <Link href="/admin/bookings" className="inline-flex h-9 items-center rounded-[3px] border border-slate-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900">
            Reset
          </Link>
        </div>
      </form>

      {error ? <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div> : null}

      <AdminSection title="Bookings table" description="Database-backed reservations across all hotels, partners, guests, and payment states.">
        <AdminTable
          rows={result.bookings}
          columns={columns}
          getRowKey={(booking) => String(booking.id)}
          emptyState={<AdminEmptyState title="No bookings found" description="Adjust filters to broaden the booking search." />}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>Page {result.pagination.page} of {result.pagination.totalPages} / {result.pagination.totalItems} bookings</span>
        <div className="flex items-center gap-2">
          <Link href={bookingsHref(result.filters, { page: Math.max(1, result.pagination.page - 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Previous
          </Link>
          <Link href={bookingsHref(result.filters, { page: Math.min(result.pagination.totalPages, result.pagination.page + 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
