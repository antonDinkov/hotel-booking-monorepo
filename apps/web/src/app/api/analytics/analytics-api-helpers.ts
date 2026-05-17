import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parsePartnerAnalyticsFilters } from "@/lib/partner-analytics-validation";
import type { PartnerAnalyticsFilters } from "@/types/partner-analytics";

type AnalyticsHandler<T> = (
  userId: string,
  filters: PartnerAnalyticsFilters
) => Promise<T>;

function mapAnalyticsError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid analytics query", code, 400);
  }

  if (code === "PARTNER_PROFILE_NOT_FOUND") {
    return apiError("Partner profile not found", code, 403);
  }

  console.error("Partner analytics request failed:", error);
  return apiError("Partner analytics request failed", "PARTNER_ANALYTICS_REQUEST_FAILED", 500);
}

export async function handlePartnerAnalyticsRequest<T>(
  request: Request,
  handler: AnalyticsHandler<T>
) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const filters = parsePartnerAnalyticsFilters(new URL(request.url).searchParams);
    const data = await handler(auth.userId as string, filters);
    return NextResponse.json({ data });
  } catch (error) {
    return mapAnalyticsError(error);
  }
}
