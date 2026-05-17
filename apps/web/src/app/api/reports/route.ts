import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminReportFilters } from "@/lib/admin-report-validation";
import { getAdminReports } from "@/server/services/adminReports";

export async function GET(request: Request) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const filters = parseAdminReportFilters(new URL(request.url).searchParams);
    const data = await getAdminReports(filters);
    return NextResponse.json({ data });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (code === "VALIDATION_ERROR") {
      return apiError("Invalid report filters", code, 400);
    }

    console.error("Admin reports request failed:", error);
    return apiError("Reports request failed", "ADMIN_REPORTS_REQUEST_FAILED", 500);
  }
}
