import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { roles, userProfiles, userRoles, users } from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import type {
  AdminAccountSettings,
  AdminAccountSettingsUpdateInput,
} from "@/types/admin-settings";

type AdminAccountRow = {
  userId: string;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
  createdAt: Date | string | null;
  fullName: string | null;
  phone: string | null;
  avatarKey: string | null;
};

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function getAvatarUrl(avatarKey: string | null): string | null {
  return avatarKey ? resolveImageUrl(avatarKey) : null;
}

async function getAccountRow(userId: string): Promise<AdminAccountRow | null> {
  return db
    .select({
      userId: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      createdAt: users.createdAt,
      fullName: userProfiles.fullName,
      phone: userProfiles.phone,
      avatarKey: userProfiles.avatarKey,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .then((rows) => rows[0] ?? null);
}

async function getRoles(userId: string): Promise<string[]> {
  const rows = await db
    .select({ role: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))
    .orderBy(asc(roles.name));

  return rows.map((row) => row.role);
}

function mapAccount(row: AdminAccountRow, accountRoles: string[]): AdminAccountSettings {
  return {
    userId: row.userId,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    avatarUrl: getAvatarUrl(row.avatarKey),
    roles: accountRoles,
    isActive: row.isActive,
    createdAt: toIsoString(row.createdAt),
    canChangePassword: Boolean(row.passwordHash),
  };
}

async function requireAccountRow(userId: string): Promise<AdminAccountRow> {
  const row = await getAccountRow(userId);
  if (!row) throw new Error("USER_NOT_FOUND");
  return row;
}

async function upsertProfile(
  userId: string,
  input: AdminAccountSettingsUpdateInput
): Promise<void> {
  if (input.fullName === undefined && input.phone === undefined) return;

  await db
    .insert(userProfiles)
    .values({
      userId,
      fullName: toNullableString(input.fullName),
      phone: toNullableString(input.phone),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...(input.fullName !== undefined
          ? { fullName: toNullableString(input.fullName) }
          : {}),
        ...(input.phone !== undefined
          ? { phone: toNullableString(input.phone) }
          : {}),
        updatedAt: new Date(),
      },
    });
}

export async function getAdminAccountSettings(
  userId: string
): Promise<AdminAccountSettings> {
  const [row, accountRoles] = await Promise.all([
    requireAccountRow(userId),
    getRoles(userId),
  ]);

  return mapAccount(row, accountRoles);
}

export async function updateAdminAccountSettings(
  userId: string,
  input: AdminAccountSettingsUpdateInput
): Promise<AdminAccountSettings> {
  await requireAccountRow(userId);
  await upsertProfile(userId, input);
  return getAdminAccountSettings(userId);
}
