import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users, roles, userRoles } from "@/db/schema";

export async function validateCredentials(email: string, password: string) {
    const user = await db
        .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, email))
        .then((rows) => rows[0]);

    if (!user || !user.passwordHash) return null;

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

    return rows.map((r: any) => r.name as string);
}
