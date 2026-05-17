import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parsePartnerAccountSettingsInput } from "@/lib/partner-settings-validation";
import {
  getPartnerAccountSettings,
  updatePartnerAccountSettings,
} from "@/server/services/partnerSettings";

function mapUserSettingsError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid account settings fields", code, 400);
  }
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "USER_NOT_FOUND") return apiError("User not found", code, 404);
  if (code === "PARTNER_PROFILE_NOT_FOUND") {
    return apiError("Partner profile not found", code, 403);
  }
  if (code === "PASSWORD_CHANGE_UNAVAILABLE") {
    return apiError("Password change is not available for this account", code, 400);
  }
  if (code === "INVALID_CURRENT_PASSWORD") {
    return apiError("Current password is incorrect", code, 400);
  }

  console.error("Partner account settings request failed:", error);
  return apiError("Account settings request failed", "ACCOUNT_SETTINGS_REQUEST_FAILED", 500);
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export async function GET() {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const data = await getPartnerAccountSettings(auth.userId as string);
    return NextResponse.json({ data });
  } catch (error) {
    return mapUserSettingsError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const input = parsePartnerAccountSettingsInput(await readJson(request));
    const data = await updatePartnerAccountSettings(auth.userId as string, input);
    return NextResponse.json({ data });
  } catch (error) {
    return mapUserSettingsError(error);
  }
}
