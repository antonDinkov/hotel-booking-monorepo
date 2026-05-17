import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parsePartnerCalendarFilters } from "@/lib/partner-calendar-validation";
import { getPartnerCalendar } from "@/server/services/partnerCalendar";

function mapCalendarError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") return apiError("Missing or invalid calendar query", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") return apiError("Partner profile not found", code, 403);

  console.error("Partner calendar request failed:", error);
  return apiError("Partner calendar request failed", "PARTNER_CALENDAR_REQUEST_FAILED", 500);
}

export async function GET(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const filters = parsePartnerCalendarFilters(new URL(request.url).searchParams);
    const result = await getPartnerCalendar(auth.userId as string, filters);
    return NextResponse.json({ data: result });
  } catch (error) {
    return mapCalendarError(error);
  }
}
