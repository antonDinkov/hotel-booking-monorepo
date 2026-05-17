import { z } from "zod";

import { adminBookingStatuses } from "@/lib/admin-booking-validation";
import { isDateOnly } from "@/lib/date-only";
import type { AdminPaymentFilters } from "@/types/admin-payments";

const paymentMethods = ["stripe", "cash_on_arrival"] as const;
const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;
const sortOptions = [
  "newest",
  "oldest",
  "amount_desc",
  "amount_asc",
  "payment_status",
] as const;

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const adminPaymentFilterSchema = z
  .object({
    paymentStatus: z.preprocess(emptyToUndefined, z.enum(paymentStatuses).optional()),
    paymentMethod: z.preprocess(emptyToUndefined, z.enum(paymentMethods).optional()),
    bookingStatus: z.preprocess(emptyToUndefined, z.enum(adminBookingStatuses).optional()),
    hotelId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    partnerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    createdFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    createdTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(emptyToUndefined, z.enum(sortOptions).default("newest")),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(1)),
    pageSize: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().max(50).default(10)
    ),
  })
  .superRefine((value, ctx) => {
    if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "Created range end must be on or after the start date.",
      });
    }
  });

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminPaymentFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): AdminPaymentFilters {
  const parsed = adminPaymentFilterSchema.safeParse({
    paymentStatus: getSearchValue(source, "paymentStatus"),
    paymentMethod: getSearchValue(source, "paymentMethod"),
    bookingStatus: getSearchValue(source, "bookingStatus"),
    hotelId: getSearchValue(source, "hotelId"),
    partnerId: getSearchValue(source, "partnerId"),
    createdFrom: getSearchValue(source, "createdFrom"),
    createdTo: getSearchValue(source, "createdTo"),
    sort: getSearchValue(source, "sort"),
    page: getSearchValue(source, "page"),
    pageSize: getSearchValue(source, "pageSize"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
