import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { getAdminDashboard } from "@/server/services/adminDashboard";

export async function GET() {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const data = await getAdminDashboard(auth.roles ?? []);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return authError(403);
    }

    console.error("Admin dashboard request failed:", error);
    return apiError("Dashboard request failed", "ADMIN_DASHBOARD_REQUEST_FAILED", 500);
  }
}
