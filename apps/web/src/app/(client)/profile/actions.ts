"use server";

import type { ProfileData } from "@/types/profile";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../../../server/services/profile";
// note: dynamic import of auth/session helpers to avoid loading heavy modules at module-eval time
import { uploadAvatar, getPublicImageUrl, deleteAvatar } from "@/server/lib/r2";

export async function saveCurrentUserProfile(profile: ProfileData) {
    const existing = await getCurrentUserProfile();
    if (!existing) return null;

    return updateCurrentUserProfile({ ...profile, email: existing.email });
}

export async function uploadAvatarAction(input: FormData | File) {
    console.info("[uploadAvatarAction] entered");
    // input can be a File or a FormData containing a field named "avatar"
    const file = input instanceof FormData ? input.get("avatar") : input;

    if (!(file instanceof File)) {
        throw new Error("No file provided");
    }

    const nextAuth: any = await import("next-auth");
    const getServerSession = (nextAuth.getServerSession ?? nextAuth.default?.getServerSession) as (
        ...args: any[]
    ) => Promise<any>;
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);
    console.info("[uploadAvatarAction] session", {
        user: session?.user,
        expires: session?.expires,
    });
    const userId = session?.user?.id ? String(session.user.id) : null;

    console.info("[uploadAvatarAction] authenticated user", { userId });

    if (!userId) throw new Error("Unauthorized");

    // upload to R2 (server-side)
    const key = await uploadAvatar(userId, file);

    console.info("[uploadAvatarAction] upload finished", { key });

    const existing = await getCurrentUserProfile();
    if (!existing) throw new Error("Profile not found");

    console.info("[uploadAvatarAction] before DB update", { userId, key });
    const updated = await updateCurrentUserProfile({ ...existing, avatarKey: key });
    console.info("[uploadAvatarAction] after DB update", { userId, avatarKey: updated?.avatarKey });

    if (!updated) {
        throw new Error("Failed to update profile");
    }

    // attach public URL for immediate client use
    const avatarUrl = key ? getPublicImageUrl(key) : undefined;

    return { ...updated, avatarUrl };
}

export async function removeAvatarAction() {
    console.info("[removeAvatarAction] entered");

    const nextAuth: any = await import("next-auth");
    const getServerSession = (nextAuth.getServerSession ?? nextAuth.default?.getServerSession) as (
        ...args: any[]
    ) => Promise<any>;
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);
    console.info("[removeAvatarAction] session", { user: session?.user });
    const userId = session?.user?.id ? String(session.user.id) : null;

    if (!userId) throw new Error("Unauthorized");

    const existing = await getCurrentUserProfile();
    if (!existing) throw new Error("Profile not found");

    const key = existing.avatarKey ?? null;
    if (key) {
        console.info("[removeAvatarAction] deleting key", { key });
        await deleteAvatar(key);
        console.info("[removeAvatarAction] deleted from R2", { key });
    }

    const updated = await updateCurrentUserProfile({ ...existing, avatarKey: null });
    if (!updated) throw new Error("Failed to clear avatar_key");

    console.info("[removeAvatarAction] DB updated", { userId, avatarKey: updated.avatarKey });

    return { ...updated, avatarUrl: null };
}
