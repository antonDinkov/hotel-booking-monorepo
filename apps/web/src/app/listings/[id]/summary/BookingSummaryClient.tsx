"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { AppButton } from "@/components/AppButton";
import type { BookingSummary } from "@/types/booking";

interface BookingSummaryClientProps {
  summary: BookingSummary;
  paymentCancelled: boolean;
}

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

function getSecondsRemaining(expiresAt: string | null): number {
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatPaymentMethod(method: string): string {
  if (method === "stripe") return "Card";
  if (method === "cash_on_arrival") return "Pay on arrival";
  return "Not selected";
}

export default function BookingSummaryClient({ summary, paymentCancelled }: BookingSummaryClientProps) {
  const router = useRouter();
  const hasTriggeredTimeoutCancelRef = useRef(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCashLoading, setIsCashLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isCancellingFlow, setIsCancellingFlow] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(() => getSecondsRemaining(summary.expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(summary.expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [summary.expiresAt]);

  const supportsStripe = summary.supportedPaymentMethods.includes("stripe");
  const supportsCashOnArrival = summary.supportedPaymentMethods.includes("cash_on_arrival");
  const hasNoSupportedMethods = !supportsStripe && !supportsCashOnArrival;
  const holdExpired =
    summary.status === "expired" ||
    summary.status === "cancelled" ||
    (summary.status === "pending_payment" && secondsRemaining <= 0);
  const canPay = summary.status === "pending_payment" && !holdExpired;
  const isActionLoading = isCashLoading || isStripeLoading;
  const isPendingFlow = summary.status === "pending_payment" && !holdExpired;

  useEffect(() => {
    if (summary.status !== "pending_payment" || secondsRemaining > 0 || hasTriggeredTimeoutCancelRef.current) {
      return;
    }

    hasTriggeredTimeoutCancelRef.current = true;

    void (async () => {
      setIsCancellingFlow(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/bookings/${summary.bookingId}/cancel`, { method: "PATCH" });
        const payload = await response.json().catch(() => null) as (ApiErrorPayload & { error?: { code?: string; message?: string } }) | null;

        if (!response.ok && payload?.error?.code !== "BOOKING_NOT_PENDING") {
          setErrorMessage(payload?.error?.message ?? "Failed to cancel reservation hold.");
          hasTriggeredTimeoutCancelRef.current = false;
          return;
        }

        router.refresh();
      } catch {
        setErrorMessage("Failed to cancel reservation hold.");
        hasTriggeredTimeoutCancelRef.current = false;
      } finally {
        setIsCancellingFlow(false);
      }
    })();
  }, [router, secondsRemaining, summary.bookingId, summary.status]);

  const buildChangeDatesUrl = () => {
    const params = new URLSearchParams({
      roomTypeId: String(summary.roomTypeId),
      roomPrice: String(summary.pricePerNight),
      rooms: String(summary.roomsCount),
      guests: String(summary.guestsCount),
      roomCapacity: String(summary.roomCapacity),
    });

    return `/listings/${summary.hotelId}/pick-dates?${params.toString()}`;
  };

  const cancelPendingHoldBeforeNavigation = async (targetUrl: string) => {
    if (!isPendingFlow) {
      router.push(targetUrl);
      return;
    }

    if (isActionLoading || isCancellingFlow) {
      return;
    }

    setIsCancellingFlow(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${summary.bookingId}/cancel`, {
        method: "PATCH",
      });
      const payload = await response.json().catch(() => null) as ApiErrorPayload | null;

      if (!response.ok) {
        setErrorMessage(payload?.error?.message ?? "Failed to cancel reservation hold.");
        return;
      }

      router.push(targetUrl);
    } catch {
      setErrorMessage("Failed to cancel reservation hold.");
    } finally {
      setIsCancellingFlow(false);
    }
  };

  const handleCashOnArrival = async () => {
    if (!canPay || !supportsCashOnArrival || isActionLoading) {
      return;
    }

    setIsCashLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${summary.bookingId}/cash-on-arrival`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null) as ApiErrorPayload | null;

      if (!response.ok) {
        setErrorMessage(payload?.error?.message ?? "Failed to confirm booking.");
        return;
      }

      router.push(`/bookings/${summary.bookingId}/confirmation`);
    } catch {
      setErrorMessage("Failed to confirm booking.");
    } finally {
      setIsCashLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!canPay || !supportsStripe || isActionLoading) {
      return;
    }

    setIsStripeLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${summary.bookingId}/stripe-checkout`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null) as ({ data?: { url?: string } } & ApiErrorPayload) | null;

      if (!response.ok || !payload?.data?.url) {
        setErrorMessage(payload?.error?.message ?? "Failed to start card payment.");
        return;
      }

      window.location.assign(payload.data.url);
    } catch {
      setErrorMessage("Failed to start card payment.");
    } finally {
      setIsStripeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mb-6">
        <AppButton
          onClick={() => cancelPendingHoldBeforeNavigation(`/listings/${summary.hotelId}`)}
          variant="ghost"
          size="sm"
          className="justify-start px-0 py-0 hover:-translate-x-0.5 hover:-translate-y-0"
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          disabled={isCancellingFlow}
        >
          {isCancellingFlow ? "Cancelling hold..." : "Back to hotel"}
        </AppButton>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Booking #{summary.bookingId}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Booking Summary</h1>

            {paymentCancelled && !holdExpired && (
              <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Payment was cancelled. Your reservation hold is still active.
              </p>
            )}

            {holdExpired && (
              <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
                This reservation hold has expired. Payment actions are disabled.
              </p>
            )}

            <div className="mt-8 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Hotel</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{summary.hotelName}</p>
                <p className="mt-1 text-sm text-slate-600">{summary.hotelLocation}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Room type</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{summary.roomType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Check-in</p>
                <p className="mt-1 font-semibold text-slate-950">{summary.checkInDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Check-out</p>
                <p className="mt-1 font-semibold text-slate-950">{summary.checkOutDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Guests</p>
                <p className="mt-1 font-semibold text-slate-950">{summary.guestsCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rooms</p>
                <p className="mt-1 font-semibold text-slate-950">{summary.roomsCount}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900">Price Breakdown</h2>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">
                    ${summary.pricePerNight} x {summary.nights} night{summary.nights === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-slate-900">${summary.pricePerNight * summary.nights}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">
                    x {summary.roomsCount} room{summary.roomsCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-slate-900">{summary.roomsCount}x</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-lg font-semibold text-slate-900">Total Price</span>
                    <span className="text-2xl font-bold text-blue-600">${summary.totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6">
              <p className="text-sm text-slate-600">Total Price</p>
              <p className="mt-2 text-4xl font-bold text-slate-950">${summary.totalPrice}</p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.nights} night{summary.nights === 1 ? "" : "s"}
              </p>
            </div>

            {summary.status === "pending_payment" && (
              <div className="mb-5 rounded-lg bg-blue-50 p-4 text-blue-950">
                <p className="text-sm text-blue-800">Your reservation is held for</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{formatCountdown(secondsRemaining)}</p>
              </div>
            )}

            <AppButton
              variant="primary"
              size="lg"
              className="mb-3 w-full shadow-blue-700/25"
              onClick={() => setShowPaymentModal(true)}
              disabled={!canPay || hasNoSupportedMethods}
            >
              Go to payment
            </AppButton>

            <AppButton
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => cancelPendingHoldBeforeNavigation(buildChangeDatesUrl())}
              disabled={isCancellingFlow}
            >
              {isCancellingFlow ? "Cancelling hold..." : "Change dates"}
            </AppButton>

            <AppButton
              variant="ghost"
              size="md"
              className="mt-3 w-full"
              onClick={() => cancelPendingHoldBeforeNavigation("/dashboard")}
              disabled={isCancellingFlow}
            >
              Continue exploring
            </AppButton>

            <div className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <p>Payment method: {formatPaymentMethod(summary.paymentMethod ?? "")}</p>
              <p className="mt-2">Payment status: {summary.paymentStatus}</p>
            </div>
          </div>
        </aside>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Choose payment method</h2>

            {hasNoSupportedMethods && (
              <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                This hotel has no available payment methods right now.
              </p>
            )}

            {holdExpired && (
              <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                This reservation hold has expired.
              </p>
            )}

            {errorMessage && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>}

            <div className="mt-5 space-y-3">
              <AppButton
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!supportsStripe || !canPay || isActionLoading}
                onClick={handleStripeCheckout}
              >
                {isStripeLoading ? "Opening checkout..." : "Pay now with card"}
              </AppButton>

              <AppButton
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={!supportsCashOnArrival || !canPay || isActionLoading}
                onClick={handleCashOnArrival}
              >
                {isCashLoading ? "Confirming..." : "Pay on arrival"}
              </AppButton>
            </div>

            <AppButton
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setShowPaymentModal(false)}
              disabled={isActionLoading}
            >
              Close
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
