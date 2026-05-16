import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { createReview, getHotelReviewsPage } from "@/server/services/reviews";
import { apiError, authError, mapReviewError, parseCreateReviewBody, parseReviewPageQuery } from "./review-api-helpers";

export async function GET(request: Request) {
  const parsed = parseReviewPageQuery(new URL(request.url).searchParams);
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
