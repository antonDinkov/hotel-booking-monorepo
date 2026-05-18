import type {
  BookingDisplayStatus,
  BookingPaymentMethod,
  BookingPaymentStatus,
  CancelledBookingBadge,
} from "@/types/booking";

interface MyBookingCardProps {
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingDisplayStatus;
  paymentMethod?: BookingPaymentMethod | null;
  paymentStatus?: BookingPaymentStatus;
  cancelledBadge?: CancelledBookingBadge;
  canReview?: boolean;
  hasReview?: boolean;
  daysRemaining?: number;
  // Accept the mouse event so the handler can stop propagation/prevent default
  onCardClick?: (e: React.MouseEvent) => void;
}

const statusStyles: Record<BookingDisplayStatus, { container: string; badge: string; label: string }> = {
  upcoming: {
    container: "border-slate-200 bg-slate-50 text-slate-900",
    badge: "bg-blue-50 text-blue-700",
    label: "Upcoming",
  },
  active: {
    container: "border-slate-200 bg-white text-slate-900 shadow-sm ring-1 ring-blue-100",
    badge: "bg-blue-700 text-white",
    label: "Active",
  },
  past: {
    container: "border-slate-200 bg-slate-100 text-slate-500",
    badge: "bg-slate-200 text-slate-600",
    label: "Past",
  },
  cancelled: {
    container: "border-red-200 bg-red-50 text-slate-900",
    badge: "bg-red-100 text-red-700",
    label: "Cancelled",
  },
};

function getCancelledDetails(label?: CancelledBookingBadge): string {
  if (label === "Cancelled · Refunded") return "Your refund has been issued.";
  if (label === "Cancelled · Refund pending") return "Your refund is being processed.";
  if (label === "Cancelled · Without refund") return "Cancelled without refund.";
  return "No payment was collected.";
}

function formatPaymentMethod(method?: BookingPaymentMethod | null): string {
  if (method === "stripe") return "Card";
  if (method === "cash_on_arrival") return "Pay on arrival";
  return "Not selected";
}

function formatPaymentStatus(status?: BookingPaymentStatus): string {
  if (!status) return "Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function MyBookingCard({
  hotelName,
  roomType,
  checkIn,
  checkOut,
  totalPrice,
  status,
  paymentMethod,
  paymentStatus,
  cancelledBadge,
  canReview,
  hasReview,
  daysRemaining,
  onCardClick,
}: MyBookingCardProps) {
  const styles = statusStyles[status];
  const badgeLabel = status === "cancelled" ? cancelledBadge ?? styles.label : styles.label;

  return (
    <article
      tabIndex={0}
      className={`rounded-3xl border p-6 transition duration-200 cursor-pointer hover:shadow-lg ${styles.container}`}
      onClick={(e) => onCardClick?.(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          // treat Enter/Space as click
          e.preventDefault();
          onCardClick?.(e as unknown as React.MouseEvent);
        }
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{hotelName}</h3>
          <p className="mt-1 text-sm text-slate-600">{roomType}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${styles.badge}`}>
            {badgeLabel}
          </span>
          <p className="text-sm font-semibold">${totalPrice}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <p className="font-semibold text-slate-900">Dates</p>
          <p className="mt-2">{checkIn} → {checkOut}</p>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <p className="font-semibold text-slate-900">Payment</p>
          <p className="mt-2 text-slate-700">{formatPaymentMethod(paymentMethod)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatPaymentStatus(paymentStatus)}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <p className="font-semibold text-slate-900">Status details</p>
          {status === "active" ? (
            <p className="mt-2 text-slate-700">
              {daysRemaining !== undefined
                ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} until checkout`
                : "Currently staying"}
            </p>
          ) : status === "upcoming" ? (
            <p className="mt-2 text-slate-700">This reservation starts soon.</p>
          ) : status === "cancelled" ? (
            <p className="mt-2 text-slate-700">{getCancelledDetails(cancelledBadge)}</p>
          ) : hasReview ? (
            <p className="mt-2 text-slate-700">Review submitted.</p>
          ) : canReview ? (
            <p className="mt-2 text-slate-700">Ready for review.</p>
          ) : (
            <p className="mt-2 text-slate-700">This stay has completed.</p>
          )}
        </div>
      </div>
    </article>
  );
}
