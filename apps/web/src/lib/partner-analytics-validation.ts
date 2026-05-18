import { z } from "zod";

import { formatDateOnly, isDateOnly, parseDateOnly } from "@/lib/date-only";
import type {
  PartnerAnalyticsBookingStatus,
  PartnerAnalyticsFilters,
  PartnerAnalyticsRangePreset,
} from "@/types/partner-analytics";

const rangeSchema = z.enum([
  "today",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
]);
const MAX_CUSTOM_ANALYTICS_DAYS = 366;

const statusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === "all" || value === null) return undefined;
  return value;
};

const analyticsFilterSchema = z.object({
  range: z.preprocess(emptyToUndefined, rangeSchema.default("last_30_days")),
  dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
  dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
  hotelId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  roomTypeId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional()
  ),
  status: z.preprocess(emptyToUndefined, statusSchema.optional()),
});

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function getPresetRange(range: PartnerAnalyticsRangePreset) {
  const today = new Date();

  if (range === "today") {
    return { dateFrom: formatDateOnly(today), dateTo: formatDateOnly(today) };
  }

  if (range === "last_7_days") {
    return { dateFrom: formatDateOnly(addDays(today, -6)), dateTo: formatDateOnly(today) };
  }

  if (range === "last_90_days") {
    return { dateFrom: formatDateOnly(addDays(today, -89)), dateTo: formatDateOnly(today) };
  }

  if (range === "this_year") {
    return { dateFrom: formatDateOnly(startOfYear(today)), dateTo: formatDateOnly(today) };
  }

  return { dateFrom: formatDateOnly(addDays(today, -29)), dateTo: formatDateOnly(today) };
}

function normalizeDateRange(input: {
  range: PartnerAnalyticsRangePreset;
  dateFrom?: string;
  dateTo?: string;
}) {
  const fallback = getPresetRange("last_30_days");
  const preset = input.range === "custom" ? fallback : getPresetRange(input.range);
  const dateFrom = input.range === "custom" ? input.dateFrom ?? fallback.dateFrom : preset.dateFrom;
  const dateTo = input.range === "custom" ? input.dateTo ?? fallback.dateTo : preset.dateTo;

  if (parseDateOnly(dateFrom).getTime() > parseDateOnly(dateTo).getTime()) {
    throw new Error("VALIDATION_ERROR");
  }

  if (input.range === "custom") {
    const from = parseDateOnly(dateFrom);
    const to = parseDateOnly(dateTo);
    const dayCount = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (dayCount > MAX_CUSTOM_ANALYTICS_DAYS) {
      throw new Error("VALIDATION_ERROR");
    }
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

export function parsePartnerAnalyticsFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): PartnerAnalyticsFilters {
  const parsed = analyticsFilterSchema.safeParse({
    range: getSearchValue(source, "range"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
    hotelId: getSearchValue(source, "hotelId"),
    roomTypeId: getSearchValue(source, "roomTypeId"),
    status: getSearchValue(source, "status"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");

  return {
    range: parsed.data.range,
    ...normalizeDateRange(parsed.data),
    hotelId: parsed.data.hotelId,
    roomTypeId: parsed.data.roomTypeId,
    status: parsed.data.status as PartnerAnalyticsBookingStatus | undefined,
  };
}
