import { z } from "zod";

const optionalText = (maxLength: number) => z.string().trim().max(maxLength).optional().default("");

const profileAddressSchema = z.object({
    street: optionalText(200),
    city: optionalText(120),
    country: optionalText(120),
    zip: optionalText(40),
});

const profilePreferencesSchema = z.object({
    smoking: z.boolean().optional().default(false),
    pets: z.boolean().optional().default(true),
    notifications: z.boolean().optional().default(true),
});

export const clientProfileSchema = z.object({
    name: optionalText(120),
    email: z.string().trim().email().optional(),
    phone: optionalText(40),
    nationality: optionalText(80),
    dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().default(""),
    gender: optionalText(80),
    passportNumber: optionalText(80),
    avatarKey: z.string().trim().nullable().optional(),
    preferences: profilePreferencesSchema.optional().default({
        smoking: false,
        pets: true,
        notifications: true,
    }),
    address: profileAddressSchema.optional().default({
        street: "",
        city: "",
        country: "",
        zip: "",
    }),
});

export function parseClientProfileInput(input: unknown) {
    return clientProfileSchema.safeParse(input);
}
