import { z } from "zod";

import { isDateOnly } from "@/lib/date-only";
import type {
  AdminPartnerListFilters,
  AdminPartnerUpdateInput,
  AdminPartnerVerificationStatus,
} from "@/types/admin-partners";

export const adminPartnerVerificationStatuses = [
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const satisfies readonly AdminPartnerVerificationStatus[];

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const verificationStatusSchema = z.enum(adminPartnerVerificationStatuses);

const partnerFilterSchema = z
  .object({
    verificationStatus: z.preprocess(
      emptyToUndefined,
      verificationStatusSchema.optional()
    ),
    verified: z.preprocess(
      emptyToUndefined,
      z.enum(["verified", "unverified"]).optional()
    ),
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(120).optional()
    ),
    createdFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    createdTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(
      emptyToUndefined,
      z
        .enum(["newest", "oldest", "company", "verification"])
        .default("newest")
    ),
    page: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(1)
    ),
    pageSize: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().max(50).default(10)
    ),
  })
  .superRefine((value, ctx) => {
    if (!value.createdFrom || !value.createdTo) return;
    if (value.createdFrom <= value.createdTo) return;

    ctx.addIssue({
      code: "custom",
      path: ["createdTo"],
      message: "Created date end must be on or after the start date.",
    });
  });

const partnerUpdateSchema = z
  .object({
    verificationStatus: verificationStatusSchema,
  })
  .strict() satisfies z.ZodType<AdminPartnerUpdateInput>;

const partnerIdSchema = z.string().uuid();

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminPartnerFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): AdminPartnerListFilters {
  const parsed = partnerFilterSchema.safeParse({
    verificationStatus: getSearchValue(source, "verificationStatus"),
    verified: getSearchValue(source, "verified"),
    search: getSearchValue(source, "search"),
    createdFrom: getSearchValue(source, "createdFrom"),
    createdTo: getSearchValue(source, "createdTo"),
    sort: getSearchValue(source, "sort"),
    page: getSearchValue(source, "page"),
    pageSize: getSearchValue(source, "pageSize"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parseAdminPartnerUpdate(
  body: unknown
): AdminPartnerUpdateInput {
  const parsed = partnerUpdateSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parseAdminPartnerId(value: string): string {
  const parsed = partnerIdSchema.safeParse(value);
  if (!parsed.success) throw new Error("INVALID_PARTNER_ID");
  return parsed.data;
}

