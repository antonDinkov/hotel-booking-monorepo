import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import {
  apiError,
  authError,
  mapPartnerReviewError,
  parsePartnerReviewReplyRequest,
  parseReviewId,
} from "@/app/api/reviews/review-api-helpers";
import {
  getPartnerReviewDetails,
  replyToPartnerReview,
} from "@/server/services/partnerReviews";
import type { PartnerReviewApiRouteContext } from "@/types/partner-review";

export async function GET(
  _request: Request,
  { params }: PartnerReviewApiRouteContext
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const reviewId = parseReviewId(id);
  if (!reviewId) return apiError("Invalid review ID", "INVALID_REVIEW_ID", 400);

  try {
    const review = await getPartnerReviewDetails(auth.userId as string, reviewId);
    if (!review) return apiError("Review not found", "REVIEW_NOT_FOUND", 404);
    return NextResponse.json({ data: review });
  } catch (error) {
    return mapPartnerReviewError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: PartnerReviewApiRouteContext
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  const { id } = await params;
  const reviewId = parseReviewId(id);
  if (!reviewId) return apiError("Invalid review ID", "INVALID_REVIEW_ID", 400);

  try {
    const input = await parsePartnerReviewReplyRequest(request);
    const review = await replyToPartnerReview(
      auth.userId as string,
      reviewId,
      input.partnerReply
    );
    return NextResponse.json({ data: review });
  } catch (error) {
    return mapPartnerReviewError(error);
  }
}
