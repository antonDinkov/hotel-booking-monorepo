"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminTable from "@/components/admin/AdminTable";
import { bookingStatusTone, paymentStatusTone } from "@/lib/admin-display";
import type { AdminTableColumn } from "@/types/admin";
import type { AdminBookingStatus } from "@/types/admin-bookings";
import type {
  AdminPaymentFilters,
  AdminPaymentListItem,
  AdminPaymentsClientProps,
} from "@/types/admin-payments";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

const paymentStatuses: BookingPaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
];
const paymentMethods: BookingPaymentMethod[] = ["stripe", "cash_on_arrival"];
const bookingStatuses: AdminBookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "expired",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "Not set";
}

function displayValue(value: string | null): string {
  return value?.trim() || "Not set";
}

function shortReference(value: string | null): string {
  if (!value) return "Not set";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function setParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (text && text !== "all") params.set(key, text);
}

function paymentsHref(filters: AdminPaymentFilters, updates: Partial<AdminPaymentFilters>) {
  const next = { ...filters, ...updates };
  const params = new URLSearchParams();

  if (next.paymentStatus) params.set("paymentStatus", next.paymentStatus);
  if (next.paymentMethod) params.set("paymentMethod", next.paymentMethod);
  if (next.bookingStatus) params.set("bookingStatus", next.bookingStatus);
  if (next.hotelId) params.set("hotelId", String(next.hotelId));
  if (next.partnerId) params.set("partnerId", next.partnerId);
  if (next.createdFrom) params.set("createdFrom", next.createdFrom);
  if (next.createdTo) params.set("createdTo", next.createdTo);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));

  const query = params.toString();
  return query ? `/admin/payments?${query}` : "/admin/payments";
}

function StripeReferences({ payment }: { payment: AdminPaymentListItem }) {
  return (
    <div className="space-y-1 font-mono text-[10px] text-slate-500">
      <p title={payment.stripeCheckoutSessionId ?? undefined}>
        session: {shortReference(payment.stripeCheckoutSessionId)}
      </p>
      <p title={payment.stripePaymentIntentId ?? undefined}>
        intent: {shortReference(payment.stripePaymentIntentId)}
      </p>
      <p title={payment.stripeRefundId ?? undefined}>
        refund: {shortReference(payment.stripeRefundId)}
      </p>
    </div>
  );
}

export default function AdminPaymentsClient({ result }: AdminPaymentsClientProps) {
  const router = useRouter();

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    setParam(params, "paymentStatus", form.get("paymentStatus"));
    setParam(params, "paymentMethod", form.get("paymentMethod"));
    setParam(params, "bookingStatus", form.get("bookingStatus"));
    setParam(params, "hotelId", form.get("hotelId"));
    setParam(params, "partnerId", form.get("partnerId"));
    setParam(params, "createdFrom", form.get("createdFrom"));
    setParam(params, "createdTo", form.get("createdTo"));
    setParam(params, "sort", form.get("sort"));
    setParam(params, "pageSize", form.get("pageSize"));

    const query = params.toString();
    router.push(query ? `/admin/payments?${query}` : "/admin/payments");
  }

  const columns: AdminTableColumn<AdminPaymentListItem>[] = [
    {
      header: "Booking",
      render: (payment) => (
        <Link href={`/admin/bookings/${payment.bookingId}`} className="font-semibold text-slate-100 hover:text-blue-200">
          #{payment.bookingId}
        </Link>
      ),
    },
    {
      header: "Guest",
      render: (payment) => (
        <Link href={`/admin/users/${payment.guestUserId}`} className="hover:text-blue-200">
          {payment.guestName}
          <span className="mt-1 block text-slate-500">{payment.guestEmail}</span>
        </Link>
      ),
    },
    {
      header: "Hotel / partner",
      render: (payment) => (
        <div>
          <Link href={`/admin/hotels/${payment.hotelId}`} className="font-semibold text-slate-100 hover:text-blue-200">
            {payment.hotelName}
          </Link>
          <Link href={`/admin/partners/${payment.partnerId}`} className="mt-1 block text-slate-500 hover:text-blue-200">
            {payment.partnerCompanyName}
          </Link>
        </div>
      ),
    },
    { header: "Room type", render: (payment) => payment.roomTypeName },
    {
      header: "Payment",
      render: (payment) => (
        <div className="space-y-1">
          <AdminStatusBadge label={payment.paymentStatus} tone={paymentStatusTone(payment.paymentStatus)} />
          <p className="text-slate-500">{displayValue(payment.paymentMethod)}</p>
        </div>
      ),
    },
    {
      header: "Booking status",
      render: (payment) => (
        <AdminStatusBadge label={payment.bookingStatus} tone={bookingStatusTone(payment.bookingStatus)} />
      ),
    },
    { header: "Amount", render: (payment) => formatCurrency(payment.totalAmount) },
    { header: "Stripe references", render: (payment) => <StripeReferences payment={payment} /> },
    { header: "Created", render: (payment) => formatDate(payment.createdAt) },
    {
      header: "Actions",
      render: (payment) => (
        <AdminActionMenu
          actions={[
            { label: "Booking", href: `/admin/bookings/${payment.bookingId}`, tone: "blue" },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Paid revenue", formatCurrency(result.summary.paidRevenue), `${result.summary.paid} paid booking payments`],
          ["Pending payments", String(result.summary.pending), "awaiting customer or cash collection"],
          ["Failed payments", String(result.summary.failed), "booking payment failures"],
          ["Refund exposure", formatCurrency(result.summary.refundExposure), `${result.summary.refundPending} refunds pending`],
        ].map(([label, value, detail]) => (
          <AdminPanel key={label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </AdminPanel>
        ))}
      </div>

      <AdminFilters
        filters={[
          { label: "All", href: "/admin/payments", active: !result.filters.paymentStatus, count: result.summary.total },
          { label: "Paid", href: paymentsHref(result.filters, { paymentStatus: "paid", page: 1 }), active: result.filters.paymentStatus === "paid", count: result.summary.paid, tone: "blue" },
          { label: "Pending", href: paymentsHref(result.filters, { paymentStatus: "pending", page: 1 }), active: result.filters.paymentStatus === "pending", count: result.summary.pending, tone: "amber" },
          { label: "Failed", href: paymentsHref(result.filters, { paymentStatus: "failed", page: 1 }), active: result.filters.paymentStatus === "failed", count: result.summary.failed, tone: "red" },
          { label: "Refunds", href: paymentsHref(result.filters, { paymentStatus: "refund_pending", page: 1 }), active: result.filters.paymentStatus === "refund_pending", count: result.summary.refundPending, tone: "amber" },
        ]}
      />

      <form onSubmit={handleFilterSubmit} className="grid gap-3 rounded-[4px] border border-slate-800 bg-slate-950 p-3 md:grid-cols-3 xl:grid-cols-8">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Payment status
          <select name="paymentStatus" defaultValue={result.filters.paymentStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Method
          <select name="paymentMethod" defaultValue={result.filters.paymentMethod ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Booking
          <select name="bookingStatus" defaultValue={result.filters.bookingStatus ?? "all"} className="h-9 rounded-[4px] border border-slate-800 bg-[#070a0f] px-3 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-blue-500/60">
            <option value="all">All</option>
            {bookingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
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
            <option value="oldest">Oldest</option>
            <option value="amount_desc">Amount high</option>
            <option value="amount_asc">Amount low</option>
            <option value="payment_status">Payment status</option>
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
          <Link href="/admin/payments" className="inline-flex h-9 items-center rounded-[3px] border border-slate-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900">
            Reset
          </Link>
        </div>
      </form>

      <AdminSection title="Payment operations table" description="Booking-backed payment data populated by booking records and Stripe webhook fields.">
        <AdminTable
          rows={result.payments}
          columns={columns}
          getRowKey={(payment) => String(payment.bookingId)}
          emptyState={<AdminEmptyState title="No payments found" description="Adjust filters to broaden the payment search." />}
        />
      </AdminSection>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>Page {result.pagination.page} of {result.pagination.totalPages} / {result.pagination.totalItems} payments</span>
        <div className="flex items-center gap-2">
          <Link href={paymentsHref(result.filters, { page: Math.max(1, result.pagination.page - 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Previous
          </Link>
          <Link href={paymentsHref(result.filters, { page: Math.min(result.pagination.totalPages, result.pagination.page + 1) })} className="rounded-[3px] border border-slate-800 px-3 py-1.5 text-slate-300 hover:border-slate-700">
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
