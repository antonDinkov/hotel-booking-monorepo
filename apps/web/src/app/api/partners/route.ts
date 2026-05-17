import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminPartnerFilters } from "@/lib/admin-partner-validation";
import { listAdminPartners } from "@/server/services/adminPartners";

export async function GET(request: Request) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const filters = parseAdminPartnerFilters(new URL(request.url).searchParams);
    const data = await listAdminPartners(filters);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "VALIDATION_ERROR") {
      return apiError("Invalid partners query parameters", "VALIDATION_ERROR", 400);
    }

    console.error("Admin partners list request failed:", error);
    return apiError("Partners request failed", "PARTNERS_REQUEST_FAILED", 500);
  }
}

