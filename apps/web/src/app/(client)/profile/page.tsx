import ProfilePageClient from "./ProfilePageClient";
import type { ProfileData } from "@/types/profile";

export default function ProfilePage() {
    const userProfile: ProfileData = {
        name: "Placeholder User Name",
        email: "placeholder@example.com",
        phone: "+1 (555) 123-4567",
        nationality: "Placeholder Nationality",
        dateOfBirth: "1992-03-18",
        gender: "Prefer not to say",
        passportNumber: "A1234567",
        preferences: {
            smoking: false,
            pets: true,
            notifications: true
        },
        address: {
            street: "123 Placeholder St",
            city: "Placeholder City",
            country: "Placeholder Country",
            zip: "12345"
        }
    };

    return <ProfilePageClient initialProfile={userProfile} />;
}
