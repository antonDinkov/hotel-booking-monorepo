import type { ReactNode } from "react";

/**
 * User preference flags shown on the profile page.
 */
export interface ProfilePreferences {
    smoking: boolean;
    pets: boolean;
    notifications: boolean;
}

/**
 * Postal address details shown on the profile page.
 */
export interface ProfileAddress {
    street: string;
    city: string;
    country: string;
    zip: string;
}

/**
 * Profile data used by the client-side profile editor UI.
 */
export interface ProfileData {
    name: string;
    email: string;
    phone: string;
    nationality: string;
    dateOfBirth: string;
    gender: string;
    passportNumber: string;
    preferences: ProfilePreferences;
    address: ProfileAddress;
}

// Reusable editable field config used by the profile UI
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
