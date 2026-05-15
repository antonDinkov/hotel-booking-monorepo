"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/AppButton";
import type { BookingCancellationNotice, BookingConfirmation, CancelBookingResult } from "@/types/booking";

interface BookingConfirmationClientProps {
  confirmation: BookingConfirmation;
  stripeStatus?: string;
  stripeSessionId?: string;
}

type CancelBookingPayload = {
  data?: CancelBookingResult;
  error?: {
    code?: string;
    message?: string;
  };
};

function formatPaymentMethod(method: string | null): string {
  if (method === "stripe") return "Card";
  if (method === "cash_on_arrival") return "Pay on arrival";
  return "Not selected";
}

function getHeading(status: string, paymentStatus: string, stripeStatus?: string): string {
  if (status === "cancelled") return "Booking cancelled";
  if (status === "expired") return "Reservation hold expired";
  if (stripeStatus === "success" && paymentStatus !== "paid") return "Payment is being confirmed";
  if (status === "pending_payment") return "Reservation awaiting payment";
  return "Booking confirmed";
}

function getDescription(confirmation: BookingConfirmation, stripeStatus?: string): string {
  if (confirmation.status === "cancelled") {
    if (confirmation.paymentMethod === "cash_on_arrival" && confirmation.paymentStatus === "cancelled") {
      return "No payment was collected.";
    }

    if (confirmation.paymentMethod === "stripe" && confirmation.paymentStatus === "refunded") {
      return "Your refund has been issued.";
    }

    if (confirmation.paymentMethod === "stripe" && confirmation.paymentStatus === "refund_pending") {
      return "Your refund is being processed.";
    }

    if (confirmation.paymentMethod === "stripe" && confirmation.paymentStatus === "refund_denied") {
      return "Your stay has already started or refund is not available.";
    }

    return "This booking has been cancelled.";
  }

  if (confirmation.status === "expired") {
    return "The reservation hold expired before payment was completed.";
  }

  if (stripeStatus === "success" && confirmation.paymentStatus !== "paid") {
    return "Stripe has redirected back to the app. The webhook still needs to confirm the payment.";
  }

  if (confirmation.paymentMethod === "cash_on_arrival") {
    return "Your reservation is secured. Payment will be collected at the hotel.";
  }

  if (confirmation.paymentMethod === "stripe" && confirmation.paymentStatus === "paid") {
    return "Your reservation is secured and card payment is complete.";
  }

  return "Choose a payment method before the reservation hold expires.";
}

function getErrorNotice(error?: CancelBookingPayload["error"]): BookingCancellationNotice {
  if (error?.code === "BOOKING_ALREADY_STARTED") {
    return {
      title: "Booking cannot be cancelled",
      message: error.message ?? "This booking has already started and cannot be cancelled automatically. Please contact support or the hotel.",
    };
  }

  if (error?.code === "BOOKING_REFUND_PAYMENT_INTENT_MISSING" || error?.code === "STRIPE_REFUND_FAILED") {
    return { title: "Refund failed", message: "Please contact support." };
  }

  return {
    title: "Cancellation failed",
    message: error?.message ?? "Please contact support.",
  };
}

export default function BookingConfirmationClient({
  confirmation,
  stripeStatus,
  stripeSessionId,
}: BookingConfirmationClientProps) {
  const router = useRouter();
  const hasAttemptedStripeSyncRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSyncingStripe, setIsSyncingStripe] = useState(false);
  const [status, setStatus] = useState(confirmation.status);
  const [paymentMethod, setPaymentMethod] = useState(confirmation.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(confirmation.paymentStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancellationNotice, setCancellationNotice] = useState<BookingCancellationNotice | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

  const isPendingFlow = status === "pending_payment";
  const canReturnToPayment = status === "pending_payment" && confirmation.expiresAt;
  const canCancelBooking = (status === "pending_payment" || status === "confirmed") && !isCancelling;

  useEffect(() => {
    if (
      stripeStatus !== "success" ||
      paymentStatus === "paid" ||
      status !== "pending_payment" ||
      !stripeSessionId ||
      hasAttemptedStripeSyncRef.current
    ) {
      return;
    }

    hasAttemptedStripeSyncRef.current = true;

    void (async () => {
      setIsSyncingStripe(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/bookings/${confirmation.bookingId}/stripe-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: stripeSessionId }),
        });
        const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;

        if (!response.ok) {
          if (payload?.error?.code !== "PAYMENT_NOT_COMPLETED") {
            setErrorMessage(payload?.error?.message ?? "Failed to confirm Stripe payment.");
          }
          return;
        }

        setPaymentStatus("paid");
        setStatus("confirmed");
        router.refresh();
      } catch {
        setErrorMessage("Failed to confirm Stripe payment.");
      } finally {
        setIsSyncingStripe(false);
      }
    })();
  }, [confirmation.bookingId, paymentStatus, router, status, stripeSessionId, stripeStatus]);

  const handleCancelBooking = async (): Promise<boolean> => {
    if (!canCancelBooking) {
      return false;
    }

    setIsCancelling(true);
    setErrorMessage(null);
    setCancellationNotice(null);

    try {
      const response = await fetch(`/api/bookings/${confirmation.bookingId}/cancel`, {
        method: "PATCH",
      });
      const payload = await response.json().catch(() => null) as CancelBookingPayload | null;

      if (!response.ok || !payload?.data) {
        setNoticeTone("error");
        setCancellationNotice(getErrorNotice(payload?.error));
        return false;
      }

      setStatus(payload.data.status);
      setPaymentMethod(payload.data.paymentMethod);
      setPaymentStatus(payload.data.paymentStatus);
      setNoticeTone("success");
      setCancellationNotice(payload.data.notification);
      router.refresh();
      return true;
    } catch {
      setNoticeTone("error");
      setCancellationNotice({ title: "Cancellation failed", message: "Please contact support." });
      return false;
    } finally {
      setIsCancelling(false);
    }
  };

  const handleContinueExploring = async () => {
    if (!isPendingFlow) {
      router.push("/dashboard");
      return;
    }

    const cancelled = await handleCancelBooking();
    if (!cancelled) {
      return;
    }

    router.push("/dashboard");
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">
        {getHeading(status, paymentStatus, stripeStatus)}
      </h1>
      <p className="mt-2 text-slate-600">
        {getDescription({ ...confirmation, status, paymentMethod, paymentStatus }, stripeStatus)}
      </p>
      {isSyncingStripe && (
        <p className="mt-3 text-sm text-slate-500">Syncing Stripe payment status...</p>
      )}

      {errorMessage && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>}
      {cancellationNotice && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${
          noticeTone === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
        }`}>
          <p className="font-semibold">{cancellationNotice.title}</p>
          <p className="mt-1">{cancellationNotice.message}</p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Hotel</dt><dd className="font-medium text-slate-900">{confirmation.hotelName}</dd></div>
        <div><dt className="text-sm text-slate-500">Room type</dt><dd className="font-medium text-slate-900">{confirmation.roomType}</dd></div>
        <div><dt className="text-sm text-slate-500">Check-in date</dt><dd className="font-medium text-slate-900">{confirmation.checkInDate}</dd></div>
        <div><dt className="text-sm text-slate-500">Check-out date</dt><dd className="font-medium text-slate-900">{confirmation.checkOutDate}</dd></div>
        <div><dt className="text-sm text-slate-500">Guests</dt><dd className="font-medium text-slate-900">{confirmation.guestsCount}</dd></div>
        <div><dt className="text-sm text-slate-500">Rooms</dt><dd className="font-medium text-slate-900">{confirmation.roomsCount}</dd></div>
        <div><dt className="text-sm text-slate-500">Total price</dt><dd className="font-medium text-slate-900">${confirmation.totalPrice}</dd></div>
        <div><dt className="text-sm text-slate-500">Payment method</dt><dd className="font-medium text-slate-900">{formatPaymentMethod(paymentMethod)}</dd></div>
        <div><dt className="text-sm text-slate-500">Payment status</dt><dd className="font-medium text-slate-900">{paymentStatus}</dd></div>
        <div><dt className="text-sm text-slate-500">Booking status</dt><dd className="font-medium text-slate-900">{status}</dd></div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        {canReturnToPayment && (
          <AppButton
            variant="primary"
            size="md"
            onClick={() => router.push(`/listings/${confirmation.hotelId}/summary?bookingId=${confirmation.bookingId}`)}
          >
            Return to payment
          </AppButton>
        )}
        <AppButton
          variant="secondary"
          size="md"
          onClick={handleCancelBooking}
          disabled={!canCancelBooking}
        >
          {status === "cancelled" ? "Booking cancelled" : isCancelling ? "Cancelling..." : "Cancel booking"}
        </AppButton>
        <AppButton variant="primary" size="md" onClick={handleContinueExploring} disabled={isCancelling}>
          Continue exploring
        </AppButton>
      </div>
    </section>
  );
}
