import { redirect } from "next/navigation";

import ProfilePageClient from "./ProfilePageClient";
import { saveCurrentUserProfile } from "./actions";
import { getCurrentUserProfile } from "../../../server/services/profile";

export default async function ProfilePage() {
    const userProfile = await getCurrentUserProfile();

    if (!userProfile) {
        redirect("/login");
    }

    return <ProfilePageClient initialProfile={userProfile} onSaveProfile={saveCurrentUserProfile} />;
}
