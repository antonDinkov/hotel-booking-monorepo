import { z } from "zod";

import type { AdminAccountSettingsUpdateInput } from "@/types/admin-settings";

const nullableText = (maxLength = 120) =>
  z
    .string()
    .trim()
    .max(maxLength, "This field is too long.")
    .nullable()
    .optional()
    .transform((value) => value || null);

const adminAccountSettingsSchema = z
  .object({
    fullName: nullableText(120),
    phone: nullableText(40),
  })
  .strict() satisfies z.ZodType<AdminAccountSettingsUpdateInput>;

export function parseAdminAccountSettingsInput(
  value: unknown
): AdminAccountSettingsUpdateInput {
  const parsed = adminAccountSettingsSchema.safeParse(value);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
