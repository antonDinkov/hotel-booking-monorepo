import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { parsePartnerCompanySettingsInput } from "@/lib/partner-settings-validation";
import {
  getPartnerCompanySettings,
  updatePartnerCompanySettings,
} from "@/server/services/partnerSettings";

function mapPartnerSettingsError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid company settings fields", code, 400);
  }
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") {
    return apiError("Partner profile not found", code, 403);
  }
  if (code === "PARTNER_EMAIL_ALREADY_EXISTS") {
    return apiError("Business email is already used by another partner", code, 400);
  }
  if (code === "VAT_NUMBER_ALREADY_EXISTS") {
    return apiError("VAT number is already used by another partner", code, 400);
  }

  console.error("Partner company settings request failed:", error);
  return apiError("Company settings request failed", "COMPANY_SETTINGS_REQUEST_FAILED", 500);
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
    const data = await getPartnerCompanySettings(auth.userId as string);
    return NextResponse.json({ data });
  } catch (error) {
    return mapPartnerSettingsError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(["partner"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const input = parsePartnerCompanySettingsInput(await readJson(request));
    const data = await updatePartnerCompanySettings(auth.userId as string, input);
    return NextResponse.json({ data });
  } catch (error) {
    return mapPartnerSettingsError(error);
  }
}
