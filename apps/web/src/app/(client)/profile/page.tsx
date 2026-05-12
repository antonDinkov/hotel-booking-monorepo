import { redirect } from "next/navigation";

import ProfilePageClient from "./ProfilePageClient";
import { saveCurrentUserProfile } from "./actions";
import { getCurrentUserProfile } from "../../../server/services/profile";
import { getPublicImageUrl } from "@/server/lib/r2";

export default async function ProfilePage() {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
        redirect("/login");
    }

    // attach a computed public URL for client preview if avatarKey exists
    const profileForClient = userProfile
        ? { ...(userProfile as any), avatarUrl: userProfile.avatarKey ? getPublicImageUrl(userProfile.avatarKey) : undefined }
        : null;

    return <ProfilePageClient initialProfile={profileForClient!} onSaveProfile={saveCurrentUserProfile} />;
}
