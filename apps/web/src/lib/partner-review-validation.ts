import { z } from "zod";

import { isDateOnly } from "@/lib/date-only";
import type {
  PartnerReviewFilters,
  PartnerReviewReplyInput,
} from "@/types/partner-review";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const partnerReviewFilterSchema = z
  .object({
    hotelId: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional()
    ),
    rating: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(5).optional()
    ),
    moderationStatus: z.preprocess(
      emptyToUndefined,
      z.enum(["published", "hidden"]).optional()
    ),
    replyStatus: z.preprocess(
      emptyToUndefined,
      z.enum(["replied", "not_replied"]).optional()
    ),
    dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(["newest", "oldest", "highest_rating", "lowest_rating"]).default("newest")
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
    if (!value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo) return;

    ctx.addIssue({
      code: "custom",
      path: ["dateTo"],
      message: "Date range end must be on or after the start date.",
    });
  });

const partnerReviewReplySchema = z.object({
  partnerReply: z.string().trim().min(1).max(2000),
});

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePartnerReviewFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): PartnerReviewFilters {
  const parsed = partnerReviewFilterSchema.safeParse({
    hotelId: getSearchValue(source, "hotelId"),
    rating: getSearchValue(source, "rating"),
    moderationStatus: getSearchValue(source, "moderationStatus"),
    replyStatus: getSearchValue(source, "replyStatus"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
    sort: getSearchValue(source, "sort"),
    page: getSearchValue(source, "page"),
    pageSize: getSearchValue(source, "pageSize"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parsePartnerReviewReply(body: unknown): PartnerReviewReplyInput {
  const parsed = partnerReviewReplySchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
