import { z } from "zod";

import { isDateOnly } from "@/lib/date-only";
import type {
  AdminBookingFilters,
  AdminBookingUpdateInput,
} from "@/types/admin-bookings";

export const adminBookingStatuses = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "expired",
] as const;

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const adminBookingFilterSchema = z
  .object({
    status: z.preprocess(emptyToUndefined, z.enum(adminBookingStatuses).optional()),
    paymentStatus: z.preprocess(emptyToUndefined, z.enum(paymentStatuses).optional()),
    hotelId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    partnerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    guestSearch: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    createdFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    createdTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(["newest", "check_in", "check_out", "total_price"]).default("newest")
    ),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(1)),
    pageSize: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().max(50).default(10)
    ),
  })
  .superRefine((value, ctx) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Date range end must be on or after the start date.",
      });
    }

    if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "Created range end must be on or after the start date.",
      });
    }
  });

const adminBookingUpdateSchema = z.object({
  status: z.enum(adminBookingStatuses),
});

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminBookingFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): AdminBookingFilters {
  const parsed = adminBookingFilterSchema.safeParse({
    status: getSearchValue(source, "status"),
    paymentStatus: getSearchValue(source, "paymentStatus"),
    hotelId: getSearchValue(source, "hotelId"),
    partnerId: getSearchValue(source, "partnerId"),
    guestSearch: getSearchValue(source, "guestSearch"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
    createdFrom: getSearchValue(source, "createdFrom"),
    createdTo: getSearchValue(source, "createdTo"),
    sort: getSearchValue(source, "sort"),
    page: getSearchValue(source, "page"),
    pageSize: getSearchValue(source, "pageSize"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}

export function parseAdminBookingId(id: string): number {
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId < 1) {
    throw new Error("INVALID_BOOKING_ID");
  }

  return bookingId;
}

export function parseAdminBookingUpdate(body: unknown): AdminBookingUpdateInput {
  const parsed = adminBookingUpdateSchema.safeParse(body);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return parsed.data;
}
