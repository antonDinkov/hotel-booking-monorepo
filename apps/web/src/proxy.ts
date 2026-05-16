import { NextResponse } from "next/server";
import type { NextProxy, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicAuthRoutes = new Set([
    "/login",
    "/register",
    "/partner",
    "/partner/login",
    "/partner/register",
]);

function getRoleDashboard(roles: string[]) {
    if (roles.includes("admin")) return "/admin/dashboard";
    if (roles.includes("partner")) return "/partner/dashboard";
    return "/dashboard";
}

function getTokenRoles(token: Awaited<ReturnType<typeof getToken>>) {
    if (!token || typeof token === "string" || !Array.isArray(token.roles)) return [];
    return token.roles.filter((role: unknown): role is string => typeof role === "string");
}

function isProtectedPartnerRoute(pathname: string) {
    return pathname.startsWith("/partner") && !publicAuthRoutes.has(pathname);
}

export const proxy: NextProxy = async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const token = await getToken({ req });
    const roles = getTokenRoles(token);

    if (publicAuthRoutes.has(pathname) && token) {
        return NextResponse.redirect(new URL(getRoleDashboard(roles), req.url));
    }

    if (isProtectedPartnerRoute(pathname)) {
        if (!token) {
            const loginUrl = new URL("/partner/login", req.url);
            loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
            return NextResponse.redirect(loginUrl);
        }

        if (!roles.includes("partner")) {
            return NextResponse.redirect(new URL(getRoleDashboard(roles), req.url));
        }
    }

    return NextResponse.next();
};

export const config = {
    matcher: ["/login", "/register", "/partner/:path*"],
};
