"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AdminActionButton from "@/components/admin/AdminActionButton";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { bookingStatusTone, paymentStatusTone } from "@/lib/admin-display";
import type {
  AdminBookingDetails,
  AdminBookingDetailClientProps,
  AdminBookingStatus,
} from "@/types/admin-bookings";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelBookingResult,
} from "@/types/booking";

const statusActions: Array<{ label: string; status: AdminBookingStatus; tone: "blue" | "amber" | "red" }> = [
  { label: "Pending", status: "pending", tone: "amber" },
  { label: "Confirm", status: "confirmed", tone: "blue" },
  { label: "Complete", status: "completed", tone: "blue" },
];

type AdminBookingPayload = {
  data?: AdminBookingDetails;
  error?: {
    message?: string;
    code?: string;
  };
};

type CancelBookingPayload = {
  data?: CancelBookingResult;
  error?: {
    message?: string;
    code?: string;
  };
};

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

function displayValue(value: string | null): string {
  return value?.trim() || "Not set";
}

function isFutureDate(value: string): boolean {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date > today;
}

function canCancelBooking(
  status: AdminBookingStatus,
  paymentMethod: BookingPaymentMethod | null,
  paymentStatus: BookingPaymentStatus,
  stripeRefundId: string | null,
  checkInDate: string
): boolean {
  if (status === "pending") return true;
  if (status !== "confirmed") return false;
  if (paymentMethod === "cash_on_arrival" && paymentStatus === "pending") return true;
  if (paymentMethod !== "stripe" || paymentStatus !== "paid") return false;
  return !stripeRefundId && isFutureDate(checkInDate);
}

function cancelActionLabel(
  paymentMethod: BookingPaymentMethod | null,
  paymentStatus: BookingPaymentStatus
): string {
  if (paymentMethod === "stripe" && paymentStatus === "paid") return "Cancel + refund";
  if (paymentStatus === "pending") return "Cancel hold";
  return "Cancel";
}

export default function AdminBookingDetailClient({ booking }: AdminBookingDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(booking.status);
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const [stripeRefundId, setStripeRefundId] = useState(booking.stripeRefundId);
  const [pending, setPending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canCancel = canCancelBooking(status, paymentMethod, paymentStatus, stripeRefundId, booking.checkInDate);

  async function updateStatus(status: AdminBookingStatus) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json().catch(() => null) as AdminBookingPayload | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "Booking update failed.");
    } else {
      setStatus(payload.data.status);
      setPaymentMethod(payload.data.paymentMethod);
      setPaymentStatus(payload.data.paymentStatus);
      setStripeRefundId(payload.data.stripeRefundId);
      setSuccess("Booking status updated.");
      router.refresh();
    }

    setPending(false);
  }

  async function cancelBooking() {
    setCancelling(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "PATCH" });
    const payload = await response.json().catch(() => null) as CancelBookingPayload | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.error?.message ?? "Booking cancellation failed.");
    } else {
      setStatus("cancelled");
      setPaymentMethod(payload.data.paymentMethod);
      setPaymentStatus(payload.data.paymentStatus);
      setStripeRefundId(payload.data.stripeRefundId ?? null);
      setSuccess(payload.data.notification.message);
      router.refresh();
    }

    setCancelling(false);
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Booking inspection
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
            Booking #{booking.id}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {booking.hotelName} / {booking.checkInDate} to {booking.checkOutDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AdminActionMenu actions={[{ label: "Bookings", href: "/admin/bookings", tone: "neutral" }]} />
          {statusActions.map((action) => (
            <AdminActionButton
              key={action.status}
              tone={action.tone}
              disabled={pending || cancelling || status === action.status}
              onClick={() => void updateStatus(action.status)}
            >
              {action.label}
            </AdminActionButton>
          ))}
          {canCancel ? (
            <AdminActionButton
              tone="red"
              disabled={pending || cancelling}
              onClick={() => void cancelBooking()}
            >
              {cancelling ? "Processing..." : cancelActionLabel(paymentMethod, paymentStatus)}
            </AdminActionButton>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-[4px] border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div> : null}
      {success ? <div className="rounded-[4px] border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">{success}</div> : null}

      <div className="grid gap-4 lg:grid-cols-6">
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Status</p>
          <div className="mt-2"><AdminStatusBadge label={status} tone={bookingStatusTone(status)} /></div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Payment</p>
          <div className="mt-2"><AdminStatusBadge label={paymentStatus} tone={paymentStatusTone(paymentStatus)} /></div>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Method</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{paymentMethod ?? "Not selected"}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Total</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{formatCurrency(booking.totalPrice)}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Guests</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{booking.guestsCount}</p>
        </AdminPanel>
        <AdminPanel className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-600">Rooms</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{booking.roomsCount}</p>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminSection title="Guest">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Name: <Link href={`/admin/users/${booking.guestUserId}`} className="font-semibold text-blue-200 hover:text-blue-100">{booking.guestFullName}</Link></p>
            <p>Email: <span className="text-slate-200">{booking.guestEmail}</span></p>
            <p>Phone: <span className="text-slate-200">{displayValue(booking.guestPhone)}</span></p>
            <p>User ID: <span className="font-mono text-slate-300">{booking.guestUserId}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Hotel and partner">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Hotel: <span className="text-slate-200">{booking.hotelName}</span></p>
            <p>Location: <span className="text-slate-200">{booking.hotelLocation}</span></p>
            <p>Partner: <Link href={`/admin/partners/${booking.partnerId}`} className="font-semibold text-blue-200 hover:text-blue-100">{booking.partnerCompanyName}</Link></p>
            <p>Hotel ID: <span className="font-mono text-slate-300">{booking.hotelId}</span></p>
          </AdminPanel>
        </AdminSection>

        <AdminSection title="Room and stay">
          <AdminPanel className="space-y-2 p-4 text-xs leading-6 text-slate-400">
            <p>Room type: <span className="text-slate-200">{booking.roomTypeName}</span></p>
            <p>Capacity: <span className="text-slate-200">{booking.roomCapacity}</span></p>
            <p>Inventory: <span className="text-slate-200">{booking.totalRooms}</span></p>
            <p>Rate: <span className="text-slate-200">{formatCurrency(booking.pricePerNight)} / night</span></p>
            <p>Stay: <span className="text-slate-200">{booking.nights} nights</span></p>
          </AdminPanel>
        </AdminSection>
      </div>

      <AdminSection title="Payment references" description="Stripe identifiers are read-only; cancel/refund actions update payment state through the booking service.">
        <AdminPanel className="grid gap-3 p-4 text-xs leading-6 text-slate-400 md:grid-cols-2 xl:grid-cols-4">
          <p>Checkout session<br /><span className="font-mono text-slate-300">{displayValue(booking.stripeCheckoutSessionId)}</span></p>
          <p>Payment intent<br /><span className="font-mono text-slate-300">{displayValue(booking.stripePaymentIntentId)}</span></p>
          <p>Refund<br /><span className="font-mono text-slate-300">{displayValue(stripeRefundId)}</span></p>
          <p>Expires<br /><span className="text-slate-200">{formatDate(booking.expiresAt)}</span></p>
          <p>Created<br /><span className="text-slate-200">{formatDate(booking.createdAt)}</span></p>
          <p>Raw status<br /><span className="text-slate-200">{displayValue(booking.rawStatus)}</span></p>
          <p>Raw payment<br /><span className="text-slate-200">{displayValue(booking.rawPaymentStatus)}</span></p>
        </AdminPanel>
      </AdminSection>
    </>
  );
}
