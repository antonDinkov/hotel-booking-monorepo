import { z } from "zod";

import type {
  PartnerAccountSettingsUpdateInput,
  PartnerCompanySettingsUpdateInput,
} from "@/types/partner-settings";

const requiredText = (field: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .max(maxLength, `${field} is too long.`);

const nullableText = (maxLength = 160) =>
  z
    .string()
    .trim()
    .max(maxLength, "This field is too long.")
    .nullable()
    .optional()
    .transform((value) => value || null);

const optionalPassword = z
  .string()
  .max(128, "Password is too long.")
  .optional()
  .transform((value) => value?.trim() || undefined);

const optionalWebsite = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value || null)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid website URL.");

export const partnerAccountSettingsSchema = z
  .object({
    fullName: nullableText(120),
    phone: nullableText(40),
    currentPassword: optionalPassword,
    newPassword: optionalPassword,
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasCurrent = Boolean(value.currentPassword);
    const hasNew = Boolean(value.newPassword);

    if (hasCurrent !== hasNew) {
      ctx.addIssue({
        code: "custom",
        path: hasCurrent ? ["newPassword"] : ["currentPassword"],
        message: "Current and new password are both required.",
      });
    }

    if (value.newPassword && value.newPassword.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Password must be at least 6 characters long.",
      });
    }
  }) satisfies z.ZodType<PartnerAccountSettingsUpdateInput>;

export const partnerCompanySettingsSchema = z
  .object({
    companyName: requiredText("Company name"),
    representativeFirstName: requiredText("Representative first name", 80),
    representativeLastName: requiredText("Representative last name", 80),
    position: requiredText("Position", 100),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .transform((value) => value.toLowerCase()),
    phone: nullableText(40),
    website: optionalWebsite,
    companyAddress: nullableText(240),
    vatNumber: nullableText(60),
  })
  .strict() satisfies z.ZodType<PartnerCompanySettingsUpdateInput>;

export function parsePartnerAccountSettingsInput(
  value: unknown
): PartnerAccountSettingsUpdateInput {
  const parsed = partnerAccountSettingsSchema.safeParse(value);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parsePartnerCompanySettingsInput(
  value: unknown
): PartnerCompanySettingsUpdateInput {
  const parsed = partnerCompanySettingsSchema.safeParse(value);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
