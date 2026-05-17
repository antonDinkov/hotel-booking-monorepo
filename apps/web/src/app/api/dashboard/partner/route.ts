import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getPartnerDashboard } from "@/server/services/partnerDashboard";

function mapDashboardError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "PARTNER_PROFILE_NOT_FOUND") {
    return apiError("Partner profile not found", code, 403);
  }

  console.error("Partner dashboard request failed:", error);
  return apiError("Partner dashboard request failed", "PARTNER_DASHBOARD_REQUEST_FAILED", 500);
}

export async function GET() {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const data = await getPartnerDashboard(auth.userId as string);
    return NextResponse.json({ data });
  } catch (error) {
    return mapDashboardError(error);
  }
}
