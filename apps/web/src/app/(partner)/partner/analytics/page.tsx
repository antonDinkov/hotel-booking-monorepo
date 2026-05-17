import { redirect } from "next/navigation";
import { Suspense } from "react";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { parsePartnerAnalyticsFilters } from "@/lib/partner-analytics-validation";
import { getPartnerAnalytics } from "@/server/services/partnerAnalytics";
import type { PartnerAnalyticsPageProps } from "@/types/partner-analytics";
import PartnerAnalyticsClient from "./PartnerAnalyticsClient";

function getFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined
) {
  try {
    return parsePartnerAnalyticsFilters(searchParams ?? {});
  } catch {
    redirect("/partner/analytics");
  }
}

export default async function Page({ searchParams }: PartnerAnalyticsPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const result = await getPartnerAnalytics(auth.userId, filters);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Portfolio performance"
        title="Analytics"
        description="Database-backed metrics for owned hotels, revenue, bookings, occupancy, and published guest reviews."
      />

      <Suspense
        fallback={
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 text-sm text-slate-400">
            Loading analytics...
          </div>
        }
      >
        <PartnerAnalyticsClient key={JSON.stringify(result.filters)} initialResult={result} />
      </Suspense>
    </>
  );
}
