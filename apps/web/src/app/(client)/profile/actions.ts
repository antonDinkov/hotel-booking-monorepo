"use server";

import type { ProfileData } from "@/types/profile";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../../../server/services/profile";

export async function saveCurrentUserProfile(profile: ProfileData) {
    const existing = await getCurrentUserProfile();
    if (!existing) return null;

    return updateCurrentUserProfile({ ...profile, email: existing.email });
}
