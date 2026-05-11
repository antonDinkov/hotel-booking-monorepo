"use client";

import { useState, useRef, useEffect } from "react";
import ProfileField from "../../../components/ProfileField";
import ProfileAvatar from "../../../components/ProfileAvatar";
import type {
    ProfileData,
    EditableField,
    InputType,
    EditableFieldConfig
} from "@/types/profile";

interface ProfilePageClientProps {
    initialProfile: ProfileData;
}

const PERSONAL_FIELDS: EditableFieldConfig<EditableField>[] = [
    {
        key: "name",
        label: "Name",
        inputType: "text",
        placeholder: "Full name"
    },
    {
        key: "email",
        label: "Email",
        inputType: "text",
        placeholder: "name@example.com"
    },
    {
        key: "phone",
        label: "Phone",
        inputType: "text",
        placeholder: "+1 (555) 123-4567"
    }
];

const TRAVEL_FIELDS: EditableFieldConfig<EditableField>[] = [
    {
        key: "nationality",
        label: "Nationality",
        inputType: "text",
        placeholder: "e.g., Canadian"
    },
    {
        key: "dateOfBirth",
        label: "Date of Birth",
        inputType: "date"
    },
    {
        key: "gender",
        label: "Gender",
        inputType: "select",
        options: ["Female", "Male", "Non-binary", "Prefer not to say"]
    },
    {
        key: "passportNumber",
        label: "Passport Number",
        inputType: "text",
        placeholder: "A1234567"
    }
];

// No temp values needed; ProfileField handles local editing.

const getFieldValue = (profile: ProfileData, field: EditableField): string => {
    switch (field) {
        case "name":
        case "email":
        case "phone":
        case "nationality":
        case "dateOfBirth":
        case "gender":
        case "passportNumber":
            return profile[field];
        default:
            return "";
    }
};

const setFieldValue = (profile: ProfileData, field: EditableField, value: string): ProfileData => {
    switch (field) {
        case "name":
        case "email":
        case "phone":
        case "nationality":
        case "dateOfBirth":
        case "gender":
        case "passportNumber":
            return { ...profile, [field]: value };
        default:
            return profile;
    }
};

const formatAddress = (address: ProfileData["address"]) => {
    const parts = [address.street, address.city, address.country]
        .map((value) => value.trim())
        .filter(Boolean);
    const postal = address.zip.trim();
    const combined = postal ? [...parts, postal].join(", ") : parts.join(", ");
    return combined.length > 0 ? combined : "Not set";
};

// Local field renderer removed; using shared `ProfileSection` component

export default function ProfilePageClient({ initialProfile }: ProfilePageClientProps) {
    const [profileData, setProfileData] = useState<ProfileData>(initialProfile);
    const [addressSaved, setAddressSaved] = useState(false);
    const [savedFields, setSavedFields] = useState<Record<EditableField, boolean>>({
        name: false,
        email: false,
        phone: false,
        nationality: false,
        dateOfBirth: false,
        gender: false,
        passportNumber: false
    });

    const saveField = (field: EditableField, value: string) => {
        setProfileData((prev) => setFieldValue(prev, field, value));
        setSavedFields((prev) => ({ ...prev, [field]: true }));
        // clear saved state after a short delay
        setTimeout(() => setSavedFields((prev) => ({ ...prev, [field]: false })), 3000);
    };

    const saveAddressFromString = (val: string) => {
        const parts = val.split(",").map((p) => p.trim());
        const [street = "", city = "", country = "", zip = ""] = parts;
        setProfileData((prev) => ({ ...prev, address: { street, city, country, zip } }));
        setAddressSaved(true);
    };

    // measure the header text width and use it as avatar width (clamped)
    const headerRef = useRef<HTMLHeadingElement | null>(null);
    const [avatarWidth, setAvatarWidth] = useState<number>(40);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const update = () => {
            const w = el.offsetWidth || 0;
            // clamp to reasonable small size
            const size = Math.max(24, Math.min(w, 120));
            setAvatarWidth(size);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", update);
        };
    }, []);

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-8 flex items-center justify-between">
                <h1 ref={headerRef} className="text-3xl font-semibold tracking-tight text-slate-900">My Profile</h1>
                <ProfileAvatar targetWidth={avatarWidth} />
            </header>

            <div className="grid gap-8 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal Information</h2>
                    <div className="space-y-4">
                        {PERSONAL_FIELDS.map((field) => (
                            <ProfileField
                                key={field.key}
                                label={field.label}
                                value={getFieldValue(profileData, field.key)}
                                inputType={field.inputType}
                                placeholder={field.placeholder}
                                options={field.options}
                                onSave={(val) => saveField(field.key, val)}
                                saved={savedFields[field.key]}
                            />
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold text-slate-900">Address</h2>
                    <div className="space-y-4">
                        <ProfileField
                            label="Address"
                            value={formatAddress(profileData.address)}
                            inputType="text"
                            placeholder="Street, City, Country, ZIP"
                            onSave={saveAddressFromString}
                            onCancel={() => setAddressSaved(false)}
                            saved={addressSaved}
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Travel Details</h2>
                    <div className="space-y-4">
                        {TRAVEL_FIELDS.map((field) => (
                            <ProfileField
                                key={field.key}
                                label={field.label}
                                value={getFieldValue(profileData, field.key)}
                                inputType={field.inputType}
                                placeholder={field.placeholder}
                                options={field.options}
                                onSave={(val) => saveField(field.key, val)}
                                saved={savedFields[field.key]}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
