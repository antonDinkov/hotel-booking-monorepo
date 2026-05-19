import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/app/api/api-response";
import { createMobileClientAuthSession } from "@/server/services/auth";

const mobileLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = mobileLoginSchema.safeParse(body);

    if (!parsed.success) {
        return apiError("Invalid email or password.", "INVALID_CREDENTIALS", 401);
    }

    try {
        const result = await createMobileClientAuthSession(parsed.data.email, parsed.data.password);
        if (!result) return apiError("Invalid email or password.", "INVALID_CREDENTIALS", 401);

        return NextResponse.json({ data: result });
    } catch (error) {
        if (error instanceof Error && error.message === "NEXTAUTH_SECRET_MISSING") {
            return apiError("Authentication is not configured.", "AUTH_NOT_CONFIGURED", 500);
        }

        console.error("[mobile-login] failed", error);
        return apiError("Login failed.", "MOBILE_LOGIN_FAILED", 500);
    }
}
