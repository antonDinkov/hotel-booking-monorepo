import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createReview, getHotelReviewsPage } from "@/server/services/reviews";
import { listPartnerReviews } from "@/server/services/partnerReviews";
import {
  apiError,
  authError,
  mapAdminReviewError,
  mapPartnerReviewError,
  mapReviewError,
  parseAdminReviewQuery,
  parseCreateReviewBody,
  parsePartnerReviewQuery,
  parseReviewPageQuery,
} from "./review-api-helpers";

function shouldUsePartnerReviews(searchParams: URLSearchParams): boolean {
  if (searchParams.get("scope") === "partner") return true;
  if (!searchParams.has("hotelId")) return true;

  return ["rating", "moderationStatus", "replyStatus", "dateFrom", "dateTo", "sort", "page", "pageSize"]
    .some((key) => searchParams.has(key));
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const adminAuth = await authorizeApi(["admin"]);
  if (adminAuth.ok) {
    try {
      const filters = parseAdminReviewQuery(searchParams);
      const { listAdminReviews } = await import("@/server/services/adminReviews");
      const result = await listAdminReviews(filters);
      return NextResponse.json({ data: result });
    } catch (error) {
      return mapAdminReviewError(error);
    }
  }

  const parsed = parseReviewPageQuery(searchParams);
  if (shouldUsePartnerReviews(searchParams)) {
    const auth = await authorizeApi(["partner"]);
    if (!auth.ok) return authError(auth.status);

    try {
      const filters = parsePartnerReviewQuery(searchParams);
      const result = await listPartnerReviews(auth.userId as string, filters);
      return NextResponse.json({ data: result });
    } catch (error) {
      return mapPartnerReviewError(error);
    }
  }

  if (!parsed.success) return apiError("Missing or invalid review query", "VALIDATION_ERROR", 400);

  try {
    const reviews = await getHotelReviewsPage(parsed.data.hotelId, parsed.data);
    return NextResponse.json({ data: reviews });
  } catch (error) {
    return mapReviewError(error);
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const parsed = parseCreateReviewBody(body);
  if (!parsed.success) return apiError("Missing or invalid review fields", "VALIDATION_ERROR", 400);

  try {
    const review = await createReview({ userId: auth.userId as string, ...parsed.data });
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return mapReviewError(error);
  }
}
