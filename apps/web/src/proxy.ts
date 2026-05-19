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
const API_CORS_HEADERS =
    "Accept, Authorization, Content-Type, Origin, X-CSRF-Token, X-Requested-With, X-Auth-Return-Redirect";
const API_CORS_ORIGINS = [
    "https://bookyourstaymobile.netlify.app",
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
    "http://localhost:3001",
] as const;

function getTokenRoles(token: Awaited<ReturnType<typeof getToken>>) {
    if (!token || typeof token === "string") return [];

    const roles = Array.isArray(token.roles)
        ? token.roles
        : typeof token.role === "string"
            ? [token.role]
            : [];

    return roles.filter((role: unknown): role is string => typeof role === "string" && role.length > 0);
}

function isApiPath(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

function getConfiguredCorsOrigins(): string[] {
    const configuredOrigins = (process.env.MOBILE_CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return [...API_CORS_ORIGINS, ...configuredOrigins];
}

function getAllowedCorsOrigin(req: NextRequest): string | null {
    const origin = req.headers.get("origin");
    if (!origin) return null;

    const configuredOrigins = getConfiguredCorsOrigins();
    return configuredOrigins.includes(origin) ? origin : null;
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
