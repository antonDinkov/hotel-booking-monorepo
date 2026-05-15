"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/AppButton";
import type { BookingConfirmation } from "@/types/booking";

interface BookingConfirmationClientProps {
  confirmation: BookingConfirmation;
  stripeStatus?: string;
}

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

export default function BookingConfirmationClient({
  confirmation,
  stripeStatus,
}: BookingConfirmationClientProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [status, setStatus] = useState(confirmation.status);
  const [paymentStatus, setPaymentStatus] = useState(confirmation.paymentStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFinal = status === "cancelled" || status === "expired";
  const canReturnToPayment = status === "pending_payment" && confirmation.expiresAt;

  const handleCancelBooking = async () => {
    if (isFinal || isCancelling) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bookings/${confirmation.bookingId}/cancel`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setErrorMessage(payload?.error?.message ?? "Failed to cancel booking.");
        return;
      }

      setStatus("cancelled");
      setPaymentStatus("cancelled");
    } catch {
      setErrorMessage("Failed to cancel booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">
        {getHeading(status, paymentStatus, stripeStatus)}
      </h1>
      <p className="mt-2 text-slate-600">{getDescription({ ...confirmation, status, paymentStatus }, stripeStatus)}</p>

      {errorMessage && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>}

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Hotel</dt><dd className="font-medium text-slate-900">{confirmation.hotelName}</dd></div>
        <div><dt className="text-sm text-slate-500">Room type</dt><dd className="font-medium text-slate-900">{confirmation.roomType}</dd></div>
        <div><dt className="text-sm text-slate-500">Check-in date</dt><dd className="font-medium text-slate-900">{confirmation.checkInDate}</dd></div>
        <div><dt className="text-sm text-slate-500">Check-out date</dt><dd className="font-medium text-slate-900">{confirmation.checkOutDate}</dd></div>
        <div><dt className="text-sm text-slate-500">Guests</dt><dd className="font-medium text-slate-900">{confirmation.guestsCount}</dd></div>
        <div><dt className="text-sm text-slate-500">Rooms</dt><dd className="font-medium text-slate-900">{confirmation.roomsCount}</dd></div>
        <div><dt className="text-sm text-slate-500">Total price</dt><dd className="font-medium text-slate-900">${confirmation.totalPrice}</dd></div>
        <div><dt className="text-sm text-slate-500">Payment method</dt><dd className="font-medium text-slate-900">{formatPaymentMethod(confirmation.paymentMethod)}</dd></div>
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
          disabled={isFinal || isCancelling}
        >
          {status === "cancelled" ? "Booking cancelled" : isCancelling ? "Cancelling..." : "Cancel booking"}
        </AppButton>
        <AppButton variant="primary" size="md" onClick={() => router.push("/dashboard")}>
          Continue exploring
        </AppButton>
      </div>
    </section>
  );
}
