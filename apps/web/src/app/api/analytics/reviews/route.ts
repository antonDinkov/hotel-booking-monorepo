import { getPartnerReviewAnalytics } from "@/server/services/partnerAnalytics";
import { handlePartnerAnalyticsRequest } from "../analytics-api-helpers";

export async function GET(request: Request) {
  return handlePartnerAnalyticsRequest(request, getPartnerReviewAnalytics);
}
