import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getMyReviews } from "@/server/services/reviews";
import { authError, mapReviewError } from "../review-api-helpers";

export async function GET() {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const reviews = await getMyReviews(auth.userId as string);
    return NextResponse.json({ data: reviews });
  } catch (error) {
    return mapReviewError(error);
  }
}
