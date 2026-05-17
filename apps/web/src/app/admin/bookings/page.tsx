import { redirect } from "next/navigation";

import AdminBookingsClient from "@/components/admin/AdminBookingsClient";
import AdminPanel from "@/components/admin/AdminPanel";
import AdminSection from "@/components/admin/AdminSection";
import { authorize } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminBookingFilters } from "@/lib/admin-booking-validation";
import { listAdminBookings } from "@/server/services/adminBookings";

type AdminBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function requireAdmin() {
  const auth = await authorize(["admin"]);
  if (!auth.ok) redirect("/admin/login");
}

export default async function Page({ searchParams }: AdminBookingsPageProps) {
  await requireAdmin();

  let filters;
  try {
    filters = parseAdminBookingFilters(await searchParams);
  } catch {
    return (
      <>
        <BookingsPageHeader />
        <AdminSection title="Invalid filters">
          <AdminPanel className="p-4 text-xs leading-6 text-red-200">
            The current bookings query contains invalid status, payment, date,
            hotel, partner, guest search, sort, or pagination values.
          </AdminPanel>
        </AdminSection>
      </>
    );
  }

  const result = await listAdminBookings(filters);

  return (
    <>
      <BookingsPageHeader />
      <AdminBookingsClient result={result} />
    </>
  );
}

function BookingsPageHeader() {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        Reservation monitoring
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-slate-50">
        Booking monitoring
      </h1>
      <p className="max-w-3xl text-xs leading-5 text-slate-500">
        Database-backed booking state, guest, partner, hotel, payment, and stay
        data across the full platform.
      </p>
    </div>
  );
}
