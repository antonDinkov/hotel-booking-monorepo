import { NextResponse } from "next/server";

import { apiError } from "@/app/api/api-response";
import { authorizeApi } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    const auth = await authorizeApi(["client", "partner", "admin"]);

    if (!auth.ok) {
        return auth.status === 401
            ? apiError("Unauthorized", "UNAUTHORIZED", 401)
            : apiError("Forbidden", "FORBIDDEN", 403);
    }

    return NextResponse.json({
        data: {
            user: {
                id: auth.userId,
                email: auth.session?.user?.email,
                roles: auth.roles,
            },
        },
    });
}
