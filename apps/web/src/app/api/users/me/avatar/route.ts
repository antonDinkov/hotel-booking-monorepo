import { NextResponse } from "next/server";

import { apiError, authError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";
import { removeUserAvatar, uploadUserAvatar } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapAvatarError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "NO_FILE") return apiError("No file provided", code, 400);
  if (code === "PROFILE_NOT_FOUND") return apiError("Profile not found", code, 404);
  if (code === "Unsupported image format" || code === "File too large") {
    return apiError(code, "INVALID_AVATAR", 400);
  }

  console.error("Avatar request failed:", error);
  return apiError("Avatar request failed", "AVATAR_REQUEST_FAILED", 500);
}

export async function POST(request: Request) {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) throw new Error("NO_FILE");

    const data = await uploadUserAvatar(auth.userId as string, file);
    return NextResponse.json({ data });
  } catch (error) {
    return mapAvatarError(error);
  }
}

export async function DELETE() {
  const auth = await authorizeApi(["client"]);
  if (!auth.ok) return authError(auth.status);

  try {
    const data = await removeUserAvatar(auth.userId as string);
    return NextResponse.json({ data });
  } catch (error) {
    return mapAvatarError(error);
  }
}
