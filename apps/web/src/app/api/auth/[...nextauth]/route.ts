import NextAuth, { type NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { getToken, type JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"

import { getRoleDashboard } from "@/lib/auth/role-routing"
import { ensureOAuthUser, getUserRoles, validateCredentialsForRole } from "@/server/services/auth"

const AUTH_DEBUG_SESSION = process.env.AUTH_DEBUG_SESSION === "true";

function normalizeRoles(input: unknown): string[] {
    if (!Array.isArray(input)) return [];

    const roles = new Set<string>();
    for (const role of input) {
        if (typeof role !== "string") continue;

        const normalized = role.trim();
        if (normalized) roles.add(normalized);
    }

    return Array.from(roles);
}

function resolveRolesFromToken(token: { roles?: unknown; role?: unknown } | null | undefined): string[] {
    const roles = normalizeRoles(token?.roles);
    if (roles.length > 0) return roles;

    if (typeof token?.role === "string") {
        const normalized = token.role.trim();
        return normalized ? [normalized] : [];
    }

    return [];
}

function getPrimaryRole(roles: string[]): string | null {
    return roles[0] ?? null;
}

function logAuthSession(stage: string, payload: {
    userId: string | null;
    role: string | null;
    roles: string[];
    source: "session" | "database";
}) {
    if (!AUTH_DEBUG_SESSION) return;

    console.info("[auth] session", {
        stage,
        userId: payload.userId,
        role: payload.role,
        roles: payload.roles,
        source: payload.source,
    });
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                loginContext: { label: "Login Context", type: "text" }
            },
            async authorize(credentials) {
                const email = credentials?.email?.toString().trim();
                const password = credentials?.password?.toString();
                const loginContext = (credentials as Record<string, string> | undefined)?.loginContext?.toString();

                if (!email || !password) return null;

                if (loginContext === "partner" || loginContext === "admin") {
                    return validateCredentialsForRole(email, password, loginContext);
                }

                return validateCredentialsForRole(email, password, "client");
            }
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: {
                params: {
                    prompt: "login",
                },
            },
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "github") return true;

            console.info("[auth] GitHub profile", profile);

            const email = user.email?.toString().trim() ?? profile?.email?.toString().trim();
            if (!email) return false;

            console.info("[auth] GitHub lookup", { email });

            const { user: oauthUser, created } = await ensureOAuthUser(email);

            if (created) {
                console.info("[auth] GitHub user created", oauthUser);
            } else {
                console.info("[auth] GitHub user found", oauthUser);
            }

            user.id = oauthUser.id;
            user.email = oauthUser.email;

            const roles = await getUserRoles(oauthUser.id);
            if (!roles.includes("client")) {
                return "/login?error=" + encodeURIComponent("This account is not a client account. Please use the correct login page.");
            }

            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                const roles = normalizeRoles(await getUserRoles(user.id as string));
                token.id = user.id;
                token.sub = user.id;
                if (user.email) token.email = user.email;
                token.roles = roles;
                token.role = getPrimaryRole(roles);
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                const roles = resolveRolesFromToken(token);
                const primaryRole = getPrimaryRole(roles);

                session.user.id = (token.sub ?? token.id ?? session.user.id) as string;
                if (token.email) session.user.email = token.email as string;
                session.user.roles = roles;
                session.user.role = primaryRole;
            }

            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
}

export async function authorize(allowedRoles: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const bearerAuth = await authorizeBearerToken(allowedRoles);
        if (bearerAuth) return bearerAuth;

        return { ok: false, error: "unauthenticated" as const, session: null, roles: [] as string[], userId: null as string | null };
    }

    const userId = session.user.id;
    const sessionRoles = normalizeRoles(session.user.roles);
    const sessionPrimaryRole = typeof session.user.role === "string" ? session.user.role.trim() || null : null;

    if (sessionRoles.length > 0) {
        const hasRole = isRoleAllowed(sessionRoles, allowedRoles);
        logAuthSession("authorize", {
            userId,
            role: sessionPrimaryRole ?? getPrimaryRole(sessionRoles),
            roles: sessionRoles,
            source: "session",
        });

        if (!hasRole) {
            return { ok: false, error: "forbidden" as const, session, roles: sessionRoles, userId };
        }

        return { ok: true, session, roles: sessionRoles, userId };
    }

    const roles = normalizeRoles(await getUserRoles(userId));
    const hasRole = isRoleAllowed(roles, allowedRoles);
    logAuthSession("authorize", {
        userId,
        role: sessionPrimaryRole ?? getPrimaryRole(roles),
        roles,
        source: "database",
    });

    if (!hasRole) {
        return { ok: false, error: "forbidden" as const, session, roles, userId };
    }

    return { ok: true, session, roles, userId };
}

async function authorizeBearerToken(allowedRoles: string[]) {
    const token = await getBearerTokenFromCurrentRequest();
    const userId = getTokenUserId(token);
    if (!token || !userId) return null;

    const tokenRoles = resolveRolesFromToken(token);
    if (tokenRoles.length > 0) {
        logAuthSession("authorize-bearer", {
            userId,
            role: getPrimaryRole(tokenRoles),
            roles: tokenRoles,
            source: "session",
        });

        if (!isRoleAllowed(tokenRoles, allowedRoles)) {
            return { ok: false, error: "forbidden" as const, session: buildSessionFromToken(token, userId, tokenRoles), roles: tokenRoles, userId };
        }

        return { ok: true, session: buildSessionFromToken(token, userId, tokenRoles), roles: tokenRoles, userId };
    }

    const roles = normalizeRoles(await getUserRoles(userId));
    logAuthSession("authorize-bearer", {
        userId,
        role: getPrimaryRole(roles),
        roles,
        source: "database",
    });

    if (!isRoleAllowed(roles, allowedRoles)) {
        return { ok: false, error: "forbidden" as const, session: buildSessionFromToken(token, userId, roles), roles, userId };
    }

    return { ok: true, session: buildSessionFromToken(token, userId, roles), roles, userId };
}

async function getBearerTokenFromCurrentRequest(): Promise<JWT | null> {
    try {
        const requestHeaders = await headers();
        const authorization = requestHeaders.get("authorization");
        if (!authorization?.startsWith("Bearer ")) return null;

        return getToken({
            req: { headers: requestHeaders } as never,
        });
    } catch {
        return null;
    }
}

function getTokenUserId(token: JWT | null): string | null {
    const userId = token?.sub ?? token?.id;
    return typeof userId === "string" && userId.trim() ? userId : null;
}

function buildSessionFromToken(token: JWT, userId: string, roles: string[]) {
    return {
        user: {
            id: userId,
            email: typeof token.email === "string" ? token.email : undefined,
            role: getPrimaryRole(roles),
            roles,
        },
    };
}

function isRoleAllowed(userRoles: string[], allowedRoles: string[]) {
    return userRoles.some((role) => allowedRoles.includes(role));
}

export async function authorizeApi(allowedRoles: string[]) {
    const result = await authorize(allowedRoles);

    if (!result.ok) {
        if (result.error === "unauthenticated") {
            return { ok: false, status: 401, response: { error: "Unauthorized" } };
        }

        return { ok: false, status: 403, response: { error: "Forbidden" } };
    }

    return { ok: true, session: result.session, roles: result.roles, userId: result.userId };
}

export function redirectToRoleDashboard(roles: string[]) {
    return getRoleDashboard(roles);
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
