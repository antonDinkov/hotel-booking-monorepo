"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import ProfileField from "../../../components/ProfileField";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { uploadAvatarAction, removeAvatarAction } from "./actions";
import type {
    ProfileData,
    EditableField,
    EditableFieldConfig
} from "@/types/profile";

interface ProfilePageClientProps {
    initialProfile: ProfileData & { avatarUrl?: string | null };
    onSaveProfile?: (profile: ProfileData) => Promise<ProfileData | null>;
}

type ProfileWithAvatarUrl = ProfileData & { avatarUrl?: string | null };

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

export const getFieldValue = (profile: ProfileData, field: EditableField): string => {
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

export const setFieldValue = (profile: ProfileData, field: EditableField, value: string): ProfileData => {
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

// Address is edited as separate fields (street, city, country, zip)

export default function ProfilePageClient({ initialProfile, onSaveProfile }: ProfilePageClientProps) {
    const [profileData, setProfileData] = useState<ProfileWithAvatarUrl>(initialProfile);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [, startTransition] = useTransition();
    const profileRef = useRef<ProfileWithAvatarUrl>(profileData);
    const [savedAddress, setSavedAddress] = useState<Record<keyof ProfileData["address"], boolean>>({
        street: false,
        city: false,
        country: false,
        zip: false
    });
    const [savedFields, setSavedFields] = useState<Record<EditableField, boolean>>({
        name: false,
        email: false,
        phone: false,
        nationality: false,
        dateOfBirth: false,
        gender: false,
        passportNumber: false
    });

    useEffect(() => {
        profileRef.current = profileData;
    }, [profileData]);

    const getErrorMessage = (error: unknown, fallback: string) => (
        error instanceof Error ? error.message : fallback
    );

    const persistProfile = async (nextProfile: ProfileWithAvatarUrl) => {
        if (!onSaveProfile) return;

        const profileWithoutAvatarUrl: ProfileData = {
            name: nextProfile.name,
            email: nextProfile.email,
            phone: nextProfile.phone,
            nationality: nextProfile.nationality,
            dateOfBirth: nextProfile.dateOfBirth,
            gender: nextProfile.gender,
            passportNumber: nextProfile.passportNumber,
            avatarKey: nextProfile.avatarKey,
            preferences: nextProfile.preferences,
            address: nextProfile.address,
        };
        const updated = await onSaveProfile(profileWithoutAvatarUrl);
        if (updated) {
            setProfileData({ ...updated, avatarUrl: profileRef.current.avatarUrl });
        }
    };

    const saveField = (field: EditableField, value: string) => {
        const nextProfile = setFieldValue(profileRef.current, field, value);
        setProfileData(nextProfile);
        startTransition(() => {
            void persistProfile(nextProfile);
        });
        setSavedFields((prev) => ({ ...prev, [field]: true }));
        // clear saved state after a short delay
        setTimeout(() => setSavedFields((prev) => ({ ...prev, [field]: false })), 3000);
    };

    const saveAddressField = (field: keyof ProfileData["address"], value: string) => {
        const nextProfile = {
            ...profileRef.current,
            address: { ...profileRef.current.address, [field]: value },
        };
        setProfileData(nextProfile);
        startTransition(() => {
            void persistProfile(nextProfile);
        });
        setSavedAddress((prev) => ({ ...prev, [field]: true }));
        setTimeout(() => setSavedAddress((prev) => ({ ...prev, [field]: false })), 3000);
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
                <ProfileAvatar
                    targetWidth={avatarWidth}
                    initialSrc={profileData.avatarUrl ?? undefined}
                    isRemoving={removing}
                    onFileChange={async (file) => {
                        if (!file) return;
                        setUploadError(null);
                        setUploading(true);
                        try {
                            const formData = new FormData();
                            formData.append("avatar", file);
                            const updated = await uploadAvatarAction(formData);
                            if (updated) setProfileData(updated as ProfileWithAvatarUrl);
                        } catch (err: unknown) {
                            setUploadError(getErrorMessage(err, "Upload failed"));
                        } finally {
                            setUploading(false);
                        }
                    }}
                    onRemove={async () => {
                        // instant UI clear
                        const prev = profileData.avatarUrl;
                        setProfileData((p) => ({ ...p, avatarUrl: undefined, avatarKey: null }));
                        setUploadError(null);
                        setRemoving(true);
                        try {
                            const updated = await removeAvatarAction();
                            if (updated) setProfileData(updated as ProfileWithAvatarUrl);
                        } catch (err: unknown) {
                            // restore on error
                            setUploadError(getErrorMessage(err, "Remove failed"));
                            setProfileData((p) => ({ ...p, avatarUrl: prev } as ProfileWithAvatarUrl));
                        } finally {
                            setRemoving(false);
                        }
                    }}
                />
                {uploading ? <div className="ml-3 text-sm text-slate-500">Uploading…</div> : null}
                {uploadError ? <div className="ml-3 text-sm text-rose-600">{uploadError}</div> : null}
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
                                isEditable={field.key !== "email"}
                                saved={savedFields[field.key]}
                            />
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold text-slate-900">Address</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ProfileField
                                label="Street"
                                value={profileData.address.street}
                                inputType="text"
                                placeholder="Street address"
                                onSave={(v) => saveAddressField("street", v)}
                                saved={savedAddress.street}
                            />
                            <ProfileField
                                label="City"
                                value={profileData.address.city}
                                inputType="text"
                                placeholder="City"
                                onSave={(v) => saveAddressField("city", v)}
                                saved={savedAddress.city}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ProfileField
                                label="Country"
                                value={profileData.address.country}
                                inputType="text"
                                placeholder="Country"
                                onSave={(v) => saveAddressField("country", v)}
                                saved={savedAddress.country}
                            />
                            <ProfileField
                                label="ZIP"
                                value={profileData.address.zip}
                                inputType="text"
                                placeholder="ZIP / Postal code"
                                onSave={(v) => saveAddressField("zip", v)}
                                saved={savedAddress.zip}
                            />
                        </div>
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
