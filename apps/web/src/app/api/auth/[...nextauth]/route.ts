import NextAuth, { type NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"

import { ensureOAuthUser, getUserRoles, validateCredentials } from "@/server/services/auth"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const email = credentials?.email?.toString().trim();
                const password = credentials?.password?.toString();

                if (!email || !password) return null;

                return validateCredentials(email, password);
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

            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                if (user.email) token.email = user.email;
                token.roles = await getUserRoles(user.id as string);
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                if (token.email) session.user.email = token.email as string;
            }

            return session;
        },
        async redirect({ baseUrl }) {
            // Keep default behavior (baseUrl) — avoid forcing /dashboard here to prevent
            // having multiple redirect strategies. Middleware handles redirecting to /dashboard.
            return baseUrl;
        },
    },
}

export async function authorize(allowedRoles: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { ok: false, error: "unauthenticated" as const, session: null, roles: [] as string[], userId: null as string | null };
    }

    const roles = await getUserRoles(session.user.id as string);
    const hasRole = isRoleAllowed(roles, allowedRoles);

    if (!hasRole) {
        return { ok: false, error: "forbidden" as const, session, roles, userId: session.user.id };
    }

    return { ok: true, session, roles, userId: session.user.id };
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
    if (roles.includes("admin")) return "/admin/dashboard";
    if (roles.includes("partner")) return "/partner/dashboard";
    return "/dashboard";
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }