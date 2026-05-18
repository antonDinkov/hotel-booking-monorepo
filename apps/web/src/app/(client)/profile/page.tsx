import { redirect } from "next/navigation";

import ProfilePageClient from "./ProfilePageClient";
import { saveCurrentUserProfile } from "./actions";
import { getCurrentUserProfile } from "../../../server/services/profile";
import { getUserRoles } from "../../../server/services/auth";
import { getPublicImageUrl } from "@/server/lib/r2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export default async function ProfilePage() {
    // Check if partner — redirect to partner dashboard
    const session: Session | null = await getServerSession(authOptions);
    if (session?.user?.id) {
        const roles = await getUserRoles(session.user.id);
        if (roles.includes("partner")) {
            redirect("/partner/dashboard");
        }
    }

    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
        redirect("/login");
    }

    // attach a computed public URL for client preview if avatarKey exists
    const profileForClient = userProfile
        ? { ...userProfile, avatarUrl: userProfile.avatarKey ? getPublicImageUrl(userProfile.avatarKey) : undefined }
        : null;

    return <ProfilePageClient initialProfile={profileForClient!} onSaveProfile={saveCurrentUserProfile} />;
}
