"use client";

import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  HomeModernIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import PartnerBadge from "@/components/partner/PartnerBadge";
import PartnerCard from "@/components/partner/PartnerCard";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import PartnerSection from "@/components/partner/PartnerSection";
import type { PartnerBadgeTone } from "@/types/partner";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelBookingResult,
} from "@/types/booking";
import type {
  PartnerBookingActionNotice,
  PartnerBookingDetailClientProps,
  PartnerBookingStatus,
  PartnerBookingStatusUpdatePayload,
} from "@/types/partner-booking";

type CancelBookingPayload = {
  data?: CancelBookingResult;
  error?: {
    message?: string;
    code?: string;
  };
};

const statusOptions: Array<{ label: string; value: PartnerBookingStatus }> = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

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

function formatDateTime(value: string | null): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(value);
}

function formatPaymentMethod(value: string | null): string {
  if (!value) return "Not selected";
  return formatLabel(value);
}

function isFutureDate(value: string): boolean {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const checkIn = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return checkIn > today;
}

function canCancelBooking(
  status: PartnerBookingStatus,
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

function getCancelActionLabel(
  paymentMethod: BookingPaymentMethod | null,
  paymentStatus: BookingPaymentStatus
): string {
  if (paymentMethod === "stripe" && paymentStatus === "paid") return "Cancel and refund";
  if (paymentStatus === "pending") return "Cancel hold";
  return "Cancel booking";
}

export default function PartnerBookingDetailClient({ booking }: PartnerBookingDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(booking.status);
  const [selectedStatus, setSelectedStatus] = useState(booking.status);
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const [stripeRefundId, setStripeRefundId] = useState(booking.stripeRefundId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState<PartnerBookingActionNotice | null>(null);
  const imageUrl = booking.roomImageUrls[0] ?? booking.hotelCoverImageUrl;
  const canCancel = canCancelBooking(status, paymentMethod, paymentStatus, stripeRefundId, booking.checkInDate);
  const cancelActionLabel = getCancelActionLabel(paymentMethod, paymentStatus);

  const cancelBooking = async () => {
    setIsCancelling(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "PATCH" });
      const payload = await response.json().catch(() => null) as CancelBookingPayload | null;

      if (!response.ok || !payload?.data) {
        setNotice({ tone: "error", message: payload?.error?.message ?? "Cancellation failed." });
        return;
      }

      setStatus("cancelled");
      setSelectedStatus("cancelled");
      setPaymentMethod(payload.data.paymentMethod);
      setPaymentStatus(payload.data.paymentStatus);
      setStripeRefundId(payload.data.stripeRefundId ?? null);
      setNotice({ tone: "success", message: payload.data.notification.message });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Cancellation failed." });
    } finally {
      setIsCancelling(false);
    }
  };

  const updateStatus = async () => {
    if (selectedStatus === "cancelled") {
      await cancelBooking();
      return;
    }

    setIsUpdating(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const payload = await response.json().catch(() => null) as PartnerBookingStatusUpdatePayload | null;

      if (!response.ok || !payload?.data) {
        setNotice({ tone: "error", message: payload?.error?.message ?? "Status update failed." });
        return;
      }

      setStatus(payload.data.status);
      setSelectedStatus(payload.data.status);
      setPaymentMethod(payload.data.paymentMethod ?? paymentMethod);
      setPaymentStatus(payload.data.paymentStatus ?? paymentStatus);
      setStripeRefundId(payload.data.stripeRefundId ?? stripeRefundId);
      setNotice({
        tone: "success",
        message: payload.data.notification?.message ?? "Booking status updated.",
      });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "Status update failed." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <PartnerPageHeader
        eyebrow="Booking details"
        title={`${booking.guestFullName} - #${booking.id}`}
        description="Guest, stay, payment, room, and booking status details for an owned hotel reservation."
        actions={
          <Link
            href="/partner/bookings"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
          >
            Back to bookings
          </Link>
        }
      />

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PartnerSection title="Guest information">
            <PartnerCard>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex gap-3">
                  <UserIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Guest</p>
                    <p className="mt-1 font-semibold text-white">{booking.guestFullName}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <EnvelopeIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="mt-1 break-all font-semibold text-white">{booking.guestEmail}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PhoneIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Phone</p>
                    <p className="mt-1 font-semibold text-white">{booking.guestPhone ?? "Not provided"}</p>
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Stay details">
            <PartnerCard>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Check-in</p>
                  <p className="mt-1 font-semibold text-white">{formatDate(booking.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Check-out</p>
                  <p className="mt-1 font-semibold text-white">{formatDate(booking.checkOutDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Nights</p>
                  <p className="mt-1 font-semibold text-white">{booking.nights}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Guests / rooms</p>
                  <p className="mt-1 font-semibold text-white">
                    {booking.guestsCount} guest{booking.guestsCount === 1 ? "" : "s"} - {booking.roomsCount} room{booking.roomsCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Hotel and room">
            <PartnerCard>
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${booking.roomTypeName} at ${booking.hotelName}`}
                      width={440}
                      height={330}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No image
                    </div>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-400">Hotel</p>
                    <p className="mt-1 font-semibold text-white">{booking.hotelName}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.hotelLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Room type</p>
                    <p className="mt-1 font-semibold text-white">{booking.roomTypeName}</p>
                    <p className="mt-1 text-sm text-slate-500">Capacity {booking.roomCapacity} - {booking.totalRooms} total rooms</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Price per night</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(booking.pricePerNight)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Calculated total</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(booking.totalPrice)}</p>
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Booking timeline">
            <PartnerCard>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-400">Created</p>
                  <p className="mt-1 font-semibold text-white">{formatDateTime(booking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Check-in</p>
                  <p className="mt-1 font-semibold text-white">{formatDate(booking.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Check-out</p>
                  <p className="mt-1 font-semibold text-white">{formatDate(booking.checkOutDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current status</p>
                  <div className="mt-2">
                    <PartnerBadge tone={statusTone(status)}>{formatLabel(status)}</PartnerBadge>
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>
        </div>

        <div className="space-y-6">
          <PartnerSection title="Payment information">
            <PartnerCard>
              <div className="flex items-start gap-3">
                <BanknotesIcon className="mt-1 h-5 w-5 text-emerald-200" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(booking.totalPrice)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PartnerBadge tone={paymentTone(paymentStatus)}>
                      {formatLabel(paymentStatus)}
                    </PartnerBadge>
                    <PartnerBadge tone={statusTone(status)}>{formatLabel(status)}</PartnerBadge>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-sm text-slate-400">Payment method</p>
                  <p className="mt-1 font-semibold text-white">{formatPaymentMethod(paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Stripe checkout session</p>
                  <p className="mt-1 break-all text-sm font-semibold text-white">{booking.stripeCheckoutSessionId ?? "Not present"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Stripe payment intent</p>
                  <p className="mt-1 break-all text-sm font-semibold text-white">{booking.stripePaymentIntentId ?? "Not present"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Stripe refund</p>
                  <p className="mt-1 break-all text-sm font-semibold text-white">{stripeRefundId ?? "Not present"}</p>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Booking status">
            <PartnerCard>
              <div className="flex gap-3">
                <CalendarDaysIcon className="mt-1 h-5 w-5 text-amber-200" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-400">Update status</p>
                  <div className="mt-3 grid gap-3">
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value as PartnerBookingStatus)}
                      className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300/40"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void updateStatus()}
                      disabled={isUpdating || isCancelling || selectedStatus === status}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ArrowPathIcon className={["h-4 w-4", isUpdating ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
                      {isUpdating ? "Updating..." : "Update status"}
                    </button>
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => void cancelBooking()}
                        disabled={isUpdating || isCancelling}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300/30 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircleIcon className={["h-4 w-4", isCancelling ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
                        {isCancelling ? "Processing..." : cancelActionLabel}
                      </button>
                    ) : (
                      <p className="text-xs leading-5 text-slate-500">
                        Cancel/refund actions are available only for pending holds or refundable confirmed bookings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>

          <PartnerSection title="Booking reference">
            <PartnerCard>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <HomeModernIcon className="mt-1 h-5 w-5 text-slate-300" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-slate-400">Booking ID</p>
                    <p className="mt-1 font-semibold text-white">#{booking.id}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Hold expires</p>
                  <p className="mt-1 font-semibold text-white">{formatDateTime(booking.expiresAt)}</p>
                </div>
              </div>
            </PartnerCard>
          </PartnerSection>
        </div>
      </div>
    </>
  );
}
