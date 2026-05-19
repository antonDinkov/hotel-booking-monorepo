import type { ReactNode } from "react";
export type { ProfileAddress, ProfileData, ProfileDataWithAvatarUrl, ProfilePreferences } from "@repo/types";

// Reusable editable field config used by the profile UI.
export type InputType = "text" | "date" | "select" | "number";

export interface EditableFieldConfig<T extends string = string> {
    key: T;
    label: string;
    inputType: InputType;
    placeholder?: string;
    options?: string[];
}

export type EditableField =
    | "name"
    | "email"
    | "phone"
    | "nationality"
    | "dateOfBirth"
    | "gender"
    | "passportNumber";

export interface ProfileSectionProps {
    title: string;
    children: ReactNode;
}
