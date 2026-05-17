import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { users, roles, userRoles } from "@/db/schema";

type AuthUserRecord = {
    id: string;
    email: string;
    passwordHash: string | null;
    isActive: boolean;
};

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
