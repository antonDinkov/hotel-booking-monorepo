import { z } from "zod";

import { formatDateOnly, isDateOnly, parseDateOnly } from "@/lib/date-only";
import type { PartnerCalendarFilters } from "@/types/partner-calendar";

const MAX_CALENDAR_DAYS = 62;

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const partnerCalendarFilterSchema = z.object({
  hotelId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  roomTypeId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["pending", "confirmed", "cancelled", "completed"]).optional()
  ),
  dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
  dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
  view: z.preprocess(
    emptyToUndefined,
    z.enum(["monthly", "weekly"]).default("monthly")
  ),
});

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function countCalendarDays(start: string, end: string): number {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / 86400000) + 1;
}

function defaultRange(view: PartnerCalendarFilters["view"]) {
  const today = new Date();
  const start = view === "monthly" ? startOfMonth(today) : today;
  const end = view === "monthly" ? endOfMonth(start) : addDays(start, 6);

  return {
    dateFrom: formatDateOnly(start),
    dateTo: formatDateOnly(end),
  };
}

function normalizeRange(input: {
  dateFrom?: string;
  dateTo?: string;
  view: PartnerCalendarFilters["view"];
}) {
  const fallback = defaultRange(input.view);
  const dateFrom = input.dateFrom ?? fallback.dateFrom;
  const dateTo = input.dateTo ?? fallback.dateTo;
  const dayCount = countCalendarDays(dateFrom, dateTo);

  if (dateFrom > dateTo || dayCount < 1 || dayCount > MAX_CALENDAR_DAYS) {
    throw new Error("VALIDATION_ERROR");
  }

  return { dateFrom, dateTo };
}

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePartnerCalendarFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): PartnerCalendarFilters {
  const parsed = partnerCalendarFilterSchema.safeParse({
    hotelId: getSearchValue(source, "hotelId"),
    roomTypeId: getSearchValue(source, "roomTypeId"),
    status: getSearchValue(source, "status"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
    view: getSearchValue(source, "view"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");

  return {
    ...parsed.data,
    ...normalizeRange(parsed.data),
  };
}
