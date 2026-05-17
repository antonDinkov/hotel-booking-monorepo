import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import {
  parseAdminUserId,
  parseAdminUserUpdate,
} from "@/lib/admin-user-validation";
import {
  getAdminUserDetails,
  updateAdminUser,
} from "@/server/services/adminUsers";

type AdminUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function mapUserRouteError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "INVALID_USER_ID") return apiError("Invalid user ID", code, 400);
  if (code === "VALIDATION_ERROR") {
    return apiError("Invalid user update payload", code, 400);
  }
  if (code === "USER_NOT_FOUND") return apiError("User not found", code, 404);

  console.error("Admin user request failed:", error);
  return apiError("User request failed", "USER_REQUEST_FAILED", 500);
}

export async function GET(_request: Request, context: AdminUserRouteContext) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const userId = parseAdminUserId((await context.params).id);
    const data = await getAdminUserDetails(userId);
    if (!data) return apiError("User not found", "USER_NOT_FOUND", 404);

    return NextResponse.json({ data });
  } catch (error) {
    return mapUserRouteError(error);
  }
}

export async function PATCH(request: Request, context: AdminUserRouteContext) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const userId = parseAdminUserId((await context.params).id);
    const input = parseAdminUserUpdate(await readJson(request));
    const data = await updateAdminUser(userId, input);
    return NextResponse.json({ data });
  } catch (error) {
    return mapUserRouteError(error);
  }
}

