import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { parsePartnerBookingFilters } from "@/lib/partner-booking-validation";
import { listPartnerBookings } from "@/server/services/partnerBookings";
import type { PartnerBookingsPageProps } from "@/types/partner-booking";
import PartnerBookingsClient from "./PartnerBookingsClient";

function getFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined
) {
  try {
    return parsePartnerBookingFilters(searchParams ?? {});
  } catch {
    redirect("/partner/bookings");
  }
}

export default async function Page({ searchParams }: PartnerBookingsPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const result = await listPartnerBookings(auth.userId, filters);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Reservations"
        title="Bookings"
        description="Database-backed booking operations for owned hotels, guest stays, payment state, and booking status updates."
      />

      <PartnerBookingsClient initialResult={result} />
    </>
  );
}
