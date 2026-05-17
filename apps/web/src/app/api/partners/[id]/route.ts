import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import {
  parseAdminPartnerId,
  parseAdminPartnerUpdate,
} from "@/lib/admin-partner-validation";
import {
  getAdminPartnerDetails,
  updateAdminPartner,
} from "@/server/services/adminPartners";

type AdminPartnerRouteContext = {
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

function mapPartnerRouteError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "INVALID_PARTNER_ID") return apiError("Invalid partner ID", code, 400);
  if (code === "VALIDATION_ERROR") {
    return apiError("Invalid partner update payload", code, 400);
  }
  if (code === "PARTNER_NOT_FOUND") return apiError("Partner not found", code, 404);

  console.error("Admin partner request failed:", error);
  return apiError("Partner request failed", "PARTNER_REQUEST_FAILED", 500);
}

export async function GET(_request: Request, context: AdminPartnerRouteContext) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const partnerId = parseAdminPartnerId((await context.params).id);
    const data = await getAdminPartnerDetails(partnerId);
    if (!data) return apiError("Partner not found", "PARTNER_NOT_FOUND", 404);

    return NextResponse.json({ data });
  } catch (error) {
    return mapPartnerRouteError(error);
  }
}

export async function PATCH(request: Request, context: AdminPartnerRouteContext) {
  const auth = await authorizeApi(["admin"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const partnerId = parseAdminPartnerId((await context.params).id);
    const input = parseAdminPartnerUpdate(await readJson(request));
    const data = await updateAdminPartner(partnerId, input);
    return NextResponse.json({ data });
  } catch (error) {
    return mapPartnerRouteError(error);
  }
}

