import { z } from "zod";

import { isDateOnly } from "@/lib/date-only";
import type {
  PartnerBookingFilters,
  PartnerBookingStatusUpdateInput,
} from "@/types/partner-booking";

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

export const partnerBookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

const paymentStatusSchema = z.enum(paymentStatuses);
const bookingSortSchema = z.enum(["newest", "check_in", "check_out"]);

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const partnerBookingFilterSchema = z
  .object({
    status: z.preprocess(emptyToUndefined, partnerBookingStatusSchema.optional()),
    paymentStatus: z.preprocess(emptyToUndefined, paymentStatusSchema.optional()),
    hotelId: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional()
    ),
    dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(emptyToUndefined, bookingSortSchema.default("newest")),
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
    if (!value.dateFrom || !value.dateTo) return;
    if (value.dateFrom <= value.dateTo) return;

    ctx.addIssue({
      code: "custom",
      path: ["dateTo"],
      message: "Date range end must be on or after the start date.",
    });
  });

export const partnerBookingStatusUpdateSchema = z.object({
  status: partnerBookingStatusSchema,
});

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePartnerBookingFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): PartnerBookingFilters {
  const parsed = partnerBookingFilterSchema.safeParse({
    status: getSearchValue(source, "status"),
    paymentStatus: getSearchValue(source, "paymentStatus"),
    hotelId: getSearchValue(source, "hotelId"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
    sort: getSearchValue(source, "sort"),
    page: getSearchValue(source, "page"),
    pageSize: getSearchValue(source, "pageSize"),
  });

  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR");
  }

  return parsed.data;
}

export function parsePartnerBookingStatusUpdate(
  body: unknown
): PartnerBookingStatusUpdateInput {
  const parsed = partnerBookingStatusUpdateSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
