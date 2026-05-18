import { NextResponse } from "next/server";

import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getMyReviews, getMyReviewsPage } from "@/server/services/reviews";
import { authError, mapReviewError } from "../review-api-helpers";

export async function GET(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const searchParams = new URL(request.url).searchParams;
    const page = Number(searchParams.get("page"));
    const pageSize = Number(searchParams.get("pageSize"));
    if (Number.isInteger(page) || Number.isInteger(pageSize)) {
      const result = await getMyReviewsPage(auth.userId as string, {
        page: Number.isInteger(page) && page > 0 ? page : 1,
        pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : undefined,
      });
      return NextResponse.json({ data: result });
    }

    const reviews = await getMyReviews(auth.userId as string);
    return NextResponse.json({ data: reviews });
  } catch (error) {
    return mapReviewError(error);
  }
}
