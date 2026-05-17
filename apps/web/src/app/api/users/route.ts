import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parseAdminUserFilters } from "@/lib/admin-user-validation";
import { listAdminUsers } from "@/server/services/adminUsers";

export async function GET(request: Request) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const filters = parseAdminUserFilters(new URL(request.url).searchParams);
    const data = await listAdminUsers(filters);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "VALIDATION_ERROR") {
      return apiError("Invalid users query parameters", "VALIDATION_ERROR", 400);
    }

    console.error("Admin users list request failed:", error);
    return apiError("Users request failed", "USERS_REQUEST_FAILED", 500);
  }
}

