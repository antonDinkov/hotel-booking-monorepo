import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

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

  if (existing) {
    return { user: existing, created: false };
  }

  const created = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash: null,
    })
    .returning({ id: users.id, email: users.email });

  const createdUser = Array.isArray(created) ? created[0] : created;

  return { user: createdUser, created: true };
}
