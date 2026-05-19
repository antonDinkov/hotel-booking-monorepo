import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { encode } from "next-auth/jwt";

import { db } from "@/db";
import { users, roles, userProfiles, userRoles } from "@/db/schema";
import type { MobileLoginResult } from "@repo/types";

type AuthUserRecord = {
    id: string;
    email: string;
    passwordHash: string | null;
    isActive: boolean;
};

const MOBILE_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

async function getAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return db
        .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .then((rows) => rows[0] ?? null);
}

async function isPasswordValid(user: AuthUserRecord, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
}

async function userHasRole(userId: string, roleName: string): Promise<boolean> {
    const row = await db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(userRoles.userId, userId), eq(roles.name, roleName)))
        .then((rows) => rows[0]);

    return Boolean(row);
}

const roleMismatchMessages = {
    admin: "This account is not an admin account. Please use the correct login page.",
    client: "This account is not a client account. Please use the correct login page.",
    partner: "This account is not a partner account. Please use the correct login page.",
} as const;

export async function validateCredentialsForRole(email: string, password: string, roleName: keyof typeof roleMismatchMessages) {
    const user = await getAuthUserByEmail(email);

    if (!user || !user.isActive) return null;

    const isValid = await isPasswordValid(user, password);
    if (!isValid) return null;

    if (!(await userHasRole(user.id, roleName))) {
        throw new Error(roleMismatchMessages[roleName]);
    }

    return { id: user.id, email: user.email };
}

export async function validateCredentials(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db
        .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .then((rows) => rows[0]);

    if (!user?.passwordHash) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return { id: user.id, email: user.email };
}

export async function createMobileClientAuthSession(email: string, password: string): Promise<MobileLoginResult | null> {
    const user = await validateMobileClientCredentials(email, password);
    if (!user) return null;

    const roles = await getUserRoles(user.id);
    const accessToken = await encode({
        maxAge: MOBILE_TOKEN_MAX_AGE_SECONDS,
        secret: getNextAuthSecret(),
        token: {
            email: user.email,
            id: user.id,
            role: getPrimaryRole(roles),
            roles,
            sub: user.id,
        },
    });

    return {
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            fullName: await getUserDisplayName(user.id, user.email),
            roles,
        },
    };
}

async function validateMobileClientCredentials(email: string, password: string) {
    try {
        return await validateCredentialsForRole(email, password, "client");
    } catch (error) {
        if (error instanceof Error && error.message === roleMismatchMessages.client) return null;
        throw error;
    }
}

export async function ensureOAuthUser(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db
        .select({
            id: users.id,
            email: users.email,
        })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .then((rows) => rows[0]);

    let userId: string;

    if (existing) {
        userId = existing.id;
    } else {
        const created = await db
            .insert(users)
            .values({
                email: normalizedEmail,
                passwordHash: null,
            })
            .returning({
                id: users.id,
                email: users.email,
            });

        const createdUser = Array.isArray(created) ? created[0] : created;
        userId = createdUser.id;
    }

    // 🔥 ВЗИМАМЕ role "client"
    const clientRole = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, "client"))
        .then((rows) => rows[0]);

    if (!clientRole) {
        throw new Error("Role 'client' does not exist");
    }

    // 🔥 Проверяваме дали user вече има роля
    const existingUserRole = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .then((rows) => rows[0]);

    // ✅ ако няма → добавяме
    if (!existingUserRole) {
        await db.insert(userRoles).values({
            userId,
            roleId: clientRole.id,
        });
    }

    return {
        user: { id: userId, email: normalizedEmail },
        created: !existing,
    };
}

export async function getUserRoles(userId: string) {
    const rows = await db
        .select({ name: roles.name })
        .from(roles)
        .innerJoin(userRoles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

    return rows.map((row) => row.name);
}

async function getUserDisplayName(userId: string, email: string): Promise<string> {
    const profile = await db
        .select({ fullName: userProfiles.fullName })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .then((rows) => rows[0] ?? null);

    return profile?.fullName?.trim() || email.split("@")[0] || email;
}

function getPrimaryRole(roles: string[]): string | null {
    return roles[0] ?? null;
}

function getNextAuthSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET_MISSING");
    return secret;
}
