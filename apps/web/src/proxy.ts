import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    if (!token) return NextResponse.next();

    return NextResponse.redirect(new URL("/dashboard", req.url));
}

export const config = {
    matcher: ["/login", "/register"],
};
