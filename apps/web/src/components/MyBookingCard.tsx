import type { BookingStatus } from "@/types/booking";

interface MyBookingCardProps {
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingStatus;
  daysRemaining?: number;
  onCardClick?: () => void;
}

const statusStyles: Record<BookingStatus, { container: string; badge: string; label: string }> = {
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
};

export function MyBookingCard({
  hotelName,
  roomType,
  checkIn,
  checkOut,
  totalPrice,
  status,
  daysRemaining,
  onCardClick,
}: MyBookingCardProps) {
  const styles = statusStyles[status];

  return (
    <article
      className={`rounded-3xl border p-6 transition duration-200 cursor-pointer hover:shadow-lg ${styles.container}`}
      onClick={onCardClick}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{hotelName}</h3>
          <p className="mt-1 text-sm text-slate-600">{roomType}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${styles.badge}`}>
            {styles.label}
          </span>
          <p className="text-sm font-semibold">${totalPrice}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <p className="font-semibold text-slate-900">Dates</p>
          <p className="mt-2">{checkIn} → {checkOut}</p>
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
          ) : (
            <p className="mt-2 text-slate-700">This stay has completed.</p>
          )}
        </div>
      </div>
    </article>
  );
}
