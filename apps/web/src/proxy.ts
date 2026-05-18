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

const API_CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const API_CORS_HEADERS = "Content-Type, Authorization, X-Requested-With";

function getTokenRoles(token: Awaited<ReturnType<typeof getToken>>) {
    if (!token || typeof token === "string" || !Array.isArray(token.roles)) return [];
    return token.roles.filter((role: unknown): role is string => typeof role === "string");
}

function isApiPath(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

function getConfiguredCorsOrigins(): string[] {
    return (process.env.MOBILE_CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function isLocalDevelopmentOrigin(origin: string): boolean {
    try {
        const { hostname, protocol } = new URL(origin);
        if (protocol !== "http:" && protocol !== "https:") return false;
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
        if (hostname.startsWith("10.")) return true;
        if (hostname.startsWith("192.168.")) return true;

        const match = hostname.match(/^172\.(\d{1,2})\./);
        if (!match) return false;

        const secondOctet = Number(match[1]);
        return secondOctet >= 16 && secondOctet <= 31;
    } catch {
        return false;
    }
}

function getAllowedCorsOrigin(req: NextRequest): string | null {
    const origin = req.headers.get("origin");
    if (!origin) return null;

    const configuredOrigins = getConfiguredCorsOrigins();
    if (configuredOrigins.includes(origin)) return origin;

    return isLocalDevelopmentOrigin(origin) ? origin : null;
}

function withApiCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
    if (!origin) return response;

    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", API_CORS_METHODS);
    response.headers.set("Access-Control-Allow-Headers", API_CORS_HEADERS);
    response.headers.set("Access-Control-Max-Age", "86400");

    const vary = response.headers.get("Vary");
    response.headers.set("Vary", vary ? `${vary}, Origin` : "Origin");

    return response;
}

export const proxy: NextProxy = async function proxy(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    if (isApiPath(pathname)) {
        const origin = getAllowedCorsOrigin(req);
        if (req.method === "OPTIONS") {
            return withApiCorsHeaders(new NextResponse(null, { status: 204 }), origin);
        }

        return withApiCorsHeaders(NextResponse.next(), origin);
    }

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
        "/api/:path*",
    ],
};
