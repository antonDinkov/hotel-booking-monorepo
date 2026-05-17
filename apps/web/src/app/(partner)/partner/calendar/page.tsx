import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { parsePartnerCalendarFilters } from "@/lib/partner-calendar-validation";
import { getPartnerCalendar } from "@/server/services/partnerCalendar";
import type { PartnerCalendarPageProps } from "@/types/partner-calendar";
import PartnerCalendarClient from "./PartnerCalendarClient";

function getFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined
) {
  try {
    return parsePartnerCalendarFilters(searchParams ?? {});
  } catch {
    redirect("/partner/calendar");
  }
}

export default async function Page({ searchParams }: PartnerCalendarPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const result = await getPartnerCalendar(auth.userId, filters);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Availability"
        title="Calendar"
        description="Booking-based room availability and reservation ranges for owned hotels."
      />

      <PartnerCalendarClient key={JSON.stringify(result.filters)} initialResult={result} />
    </>
  );
}
