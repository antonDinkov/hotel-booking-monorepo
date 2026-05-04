import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { users, roles, userRoles } from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function seedAuth() {
    // Remove role mappings and roles, but do NOT delete users because bookings now reference them
    await db.delete(userRoles);
    await db.delete(roles);

    const roleNames = ["client", "partner", "admin"];

    // Idempotently insert roles and collect inserted/existing rows
    const insertedRoles = [] as { id: number; name: string }[];
    for (const name of roleNames) {
        const existing = await db.select().from(roles).where(eq(roles.name, name));
        if (existing.length > 0) {
            insertedRoles.push(existing[0]);
            continue;
        }

        const res = await db.insert(roles).values({ name }).returning({ id: roles.id, name: roles.name });
        if (Array.isArray(res) && res.length > 0) insertedRoles.push(res[0]);
        else if (res) insertedRoles.push(res as any);
    }

    const password = "123456";
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hash = await bcrypt.hash(password, saltRounds);

    // Insert user if not exists, otherwise select existing
    let userRow = (await db.select().from(users).where(eq(users.email, "peter@abv.bg")))[0];
    if (!userRow) {
        const res = await db
            .insert(users)
            .values({ email: "peter@abv.bg", passwordHash: hash })
            .returning({ id: users.id, email: users.email });

        userRow = Array.isArray(res) ? res[0] : res;
    }

    const userId = userRow.id;

    // Fetch client role id from insertedRoles
    const clientRole = insertedRoles.find((r) => r.name === "client");
    if (!clientRole) throw new Error("Client role missing after seed");

    // Assign role to user if not already assigned
    const existingMapping = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId), eq(userRoles.roleId, clientRole.id));

    if (!existingMapping || existingMapping.length === 0) {
        await db.insert(userRoles).values({ userId, roleId: clientRole.id }).returning({ userId: userRoles.userId });
    }

    console.log("Seed auth completed. User id:", userId);
}

seedAuth().catch((error) => {
    console.error("Seed auth failed", error);
    process.exitCode = 1;
});
