import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { resolveImageUrl } from "@/lib/image-urls";
import type { ProfileData, ProfileDataWithAvatarUrl, ProfilePreferences } from "@/types/profile";

const DEFAULT_PREFERENCES: ProfilePreferences = {
    smoking: false,
    pets: true,
    notifications: true,
};

type ProfileRow = {
    email: string;
    fullName: string | null;
    phone: string | null;
    nationality: string | null;
    dateOfBirth: string | Date | null;
    gender: string | null;
    passportNumber: string | null;
    avatarKey: string | null;
    street: string | null;
    city: string | null;
    country: string | null;
    zip: string | null;
};

function normalizeOptionalString(value: string | null | undefined): string {
    return value?.trim() ?? "";
}

function normalizeOptionalDbString(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function normalizeDateValue(value: ProfileRow["dateOfBirth"]): string {
    if (!value) return "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
}

function normalizeGender(value: string | null | undefined): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : "Prefer not to say";
}

function mapProfileRow(row: ProfileRow): ProfileData {
    return {
        name: normalizeOptionalString(row.fullName),
        email: row.email,
        phone: normalizeOptionalString(row.phone),
        nationality: normalizeOptionalString(row.nationality),
        dateOfBirth: normalizeDateValue(row.dateOfBirth),
        gender: normalizeGender(row.gender),
        passportNumber: normalizeOptionalString(row.passportNumber),
        avatarKey: row.avatarKey ?? null,
        preferences: DEFAULT_PREFERENCES,
        address: {
            street: normalizeOptionalString(row.street),
            city: normalizeOptionalString(row.city),
            country: normalizeOptionalString(row.country),
            zip: normalizeOptionalString(row.zip),
        },
    };
}

function withAvatarUrl(profile: ProfileData): ProfileDataWithAvatarUrl {
    return {
        ...profile,
        avatarUrl: profile.avatarKey ? resolveImageUrl(profile.avatarKey) : null,
    };
}

async function getProfileRow(userId: string): Promise<ProfileRow | null> {
    const row = await db
        .select({
            email: users.email,
            fullName: userProfiles.fullName,
            phone: userProfiles.phone,
            nationality: userProfiles.nationality,
            dateOfBirth: userProfiles.dateOfBirth,
            gender: userProfiles.gender,
            passportNumber: userProfiles.passportNumber,
            avatarKey: userProfiles.avatarKey,
            street: userProfiles.street,
            city: userProfiles.city,
            country: userProfiles.country,
            zip: userProfiles.zip,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(users.id, userId))
        .then((rows) => rows[0]);

    return row ?? null;
}

async function getCurrentUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    return session?.user?.id ? String(session.user.id) : null;
}

function buildProfileInsertValues(userId: string, profile: ProfileData) {
    return {
        userId,
        fullName: normalizeOptionalDbString(profile.name),
        phone: normalizeOptionalDbString(profile.phone),
        nationality: normalizeOptionalDbString(profile.nationality),
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth : null,
        gender: normalizeOptionalDbString(profile.gender),
        passportNumber: normalizeOptionalDbString(profile.passportNumber),
        avatarKey: normalizeOptionalDbString(profile.avatarKey ?? undefined),
        street: normalizeOptionalDbString(profile.address.street),
        city: normalizeOptionalDbString(profile.address.city),
        country: normalizeOptionalDbString(profile.address.country),
        zip: normalizeOptionalDbString(profile.address.zip),
    };
}

function buildProfileUpdateValues(profile: ProfileData) {
    return {
        fullName: normalizeOptionalDbString(profile.name),
        phone: normalizeOptionalDbString(profile.phone),
        nationality: normalizeOptionalDbString(profile.nationality),
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth : null,
        gender: normalizeOptionalDbString(profile.gender),
        passportNumber: normalizeOptionalDbString(profile.passportNumber),
        avatarKey: normalizeOptionalDbString(profile.avatarKey ?? undefined),
        street: normalizeOptionalDbString(profile.address.street),
        city: normalizeOptionalDbString(profile.address.city),
        country: normalizeOptionalDbString(profile.address.country),
        zip: normalizeOptionalDbString(profile.address.zip),
    };
}

export {
    normalizeOptionalDbString,
    normalizeDateValue,
    normalizeGender,
    normalizeOptionalString,
    mapProfileRow,
    buildProfileInsertValues,
    buildProfileUpdateValues,
};

export async function getUserProfile(userId: string): Promise<ProfileData | null> {
    const row = await getProfileRow(userId);
    return row ? mapProfileRow(row) : null;
}

export async function getUserProfileWithAvatarUrl(userId: string): Promise<ProfileDataWithAvatarUrl | null> {
    const profile = await getUserProfile(userId);
    return profile ? withAvatarUrl(profile) : null;
}

export async function updateUserProfile(userId: string, profile: ProfileData): Promise<ProfileData | null> {
    await db.update(users).set({ email: profile.email }).where(eq(users.id, userId));

    const insertValues = buildProfileInsertValues(userId, profile);
    const updateValues = buildProfileUpdateValues(profile);

    await db.insert(userProfiles).values(insertValues).onConflictDoUpdate({
        target: userProfiles.userId,
        set: updateValues,
    });

    const row = await getProfileRow(userId);
    return row ? mapProfileRow(row) : null;
}

export async function updateUserProfileWithAvatarUrl(
    userId: string,
    profile: ProfileData
): Promise<ProfileDataWithAvatarUrl | null> {
    const updated = await updateUserProfile(userId, profile);
    return updated ? withAvatarUrl(updated) : null;
}

export async function getCurrentUserProfile(): Promise<ProfileData | null> {
    const userId = await getCurrentUserId();
    return userId ? getUserProfile(userId) : null;
}

export async function updateCurrentUserProfile(profile: ProfileData): Promise<ProfileData | null> {
    const userId = await getCurrentUserId();
    return userId ? updateUserProfile(userId, profile) : null;
}

export async function uploadUserAvatar(userId: string, file: File): Promise<ProfileDataWithAvatarUrl> {
    const existing = await getUserProfile(userId);
    if (!existing) throw new Error("PROFILE_NOT_FOUND");

    const { uploadAvatar } = await import("@/server/lib/r2");
    const key = await uploadAvatar(userId, file);
    const updated = await updateUserProfile(userId, { ...existing, avatarKey: key });
    if (!updated) throw new Error("PROFILE_UPDATE_FAILED");

    return withAvatarUrl(updated);
}

export async function removeUserAvatar(userId: string): Promise<ProfileDataWithAvatarUrl> {
    const existing = await getUserProfile(userId);
    if (!existing) throw new Error("PROFILE_NOT_FOUND");

    if (existing.avatarKey) {
        const { deleteAvatar } = await import("@/server/lib/r2");
        await deleteAvatar(existing.avatarKey);
    }

    const updated = await updateUserProfile(userId, { ...existing, avatarKey: null });
    if (!updated) throw new Error("PROFILE_UPDATE_FAILED");

    return withAvatarUrl(updated);
}
