import { z } from "zod";

import { isDateOnly } from "@/lib/date-only";
import type {
  AdminUserListFilters,
  AdminUserUpdateInput,
} from "@/types/admin-users";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const userFilterSchema = z
  .object({
    role: z.preprocess(
      emptyToUndefined,
      z.enum(["client", "partner", "admin"]).optional()
    ),
    active: z.preprocess(
      emptyToUndefined,
      z.enum(["active", "inactive"]).optional()
    ),
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(120).optional()
    ),
    createdFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    createdTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(["newest", "oldest", "email", "role"]).default("newest")
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

const userUpdateSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict() satisfies z.ZodType<AdminUserUpdateInput>;

const userIdSchema = z.string().uuid();

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminUserFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): AdminUserListFilters {
  const parsed = userFilterSchema.safeParse({
    role: getSearchValue(source, "role"),
    active: getSearchValue(source, "active"),
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

export function parseAdminUserUpdate(body: unknown): AdminUserUpdateInput {
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parseAdminUserId(value: string): string {
  const parsed = userIdSchema.safeParse(value);
  if (!parsed.success) throw new Error("INVALID_USER_ID");
  return parsed.data;
}

