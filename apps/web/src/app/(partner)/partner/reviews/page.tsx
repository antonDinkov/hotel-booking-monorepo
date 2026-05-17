import { redirect } from "next/navigation";

import { authorize } from "@/app/api/auth/[...nextauth]/route";
import PartnerPageHeader from "@/components/partner/PartnerPageHeader";
import { parsePartnerReviewFilters } from "@/lib/partner-review-validation";
import { listPartnerReviews } from "@/server/services/partnerReviews";
import type { PartnerReviewsPageProps } from "@/types/partner-review";
import PartnerReviewsClient from "./PartnerReviewsClient";

function getFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined
) {
  try {
    return parsePartnerReviewFilters(searchParams ?? {});
  } catch {
    redirect("/partner/reviews");
  }
}

export default async function Page({ searchParams }: PartnerReviewsPageProps) {
  const auth = await authorize(["partner"]);
  if (!auth.ok || !auth.userId) redirect("/partner/login");

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const result = await listPartnerReviews(auth.userId, filters);

  return (
    <>
      <PartnerPageHeader
        eyebrow="Guest feedback"
        title="Reviews"
        description="Review cards for owned hotels with guest context, ratings, moderation state, and partner replies."
      />

      <PartnerReviewsClient key={JSON.stringify(result.filters)} initialResult={result} />
    </>
  );
}
