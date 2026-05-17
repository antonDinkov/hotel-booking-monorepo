import { NextResponse } from "next/server";
import type { NextProxy, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import {
    getLoginPathForRole,
    getProtectedRoleForPath,
    getRoleDashboard,
    hasRequiredRole,
    isPublicAuthRoute,
} from "@/lib/auth/role-routing";

function getTokenRoles(token: Awaited<ReturnType<typeof getToken>>) {
    if (!token || typeof token === "string" || !Array.isArray(token.roles)) return [];
    return token.roles.filter((role: unknown): role is string => typeof role === "string");
}

export const proxy: NextProxy = async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const token = await getToken({ req });
    const roles = getTokenRoles(token);
    const protectedRole = getProtectedRoleForPath(pathname);

    if (isPublicAuthRoute(pathname) && token) {
        return NextResponse.redirect(new URL(getRoleDashboard(roles), req.url));
    }

    if (protectedRole) {
        if (!token) {
            const loginUrl = new URL(getLoginPathForRole(protectedRole), req.url);
            loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }

        if (!hasRequiredRole(roles, protectedRole)) {
            return NextResponse.redirect(new URL(getRoleDashboard(roles), req.url));
        }
    }

    return NextResponse.next();
};

export const config = {
    matcher: [
        "/",
        "/login",
        "/register",
        "/dashboard/:path*",
        "/bookings/:path*",
        "/favorites/:path*",
        "/profile/:path*",
        "/reviews/:path*",
        "/partner/:path*",
        "/admin/:path*",
    ],
};
