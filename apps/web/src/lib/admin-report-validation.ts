import { z } from "zod";

import { formatDateOnly, isDateOnly, parseDateOnly } from "@/lib/date-only";
import type {
  AdminReportFilters,
  AdminReportRange,
} from "@/types/admin-reports";

const adminReportRanges = [
  "today",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
] as const;
const MAX_CUSTOM_ANALYTICS_DAYS = 366;

const dateOnlySchema = z
  .string()
  .trim()
  .refine((value) => isDateOnly(value), "Expected YYYY-MM-DD date.");

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null) return undefined;
  return value;
};

const adminReportFilterSchema = z
  .object({
    range: z.preprocess(
      emptyToUndefined,
      z.enum(adminReportRanges).default("last_30_days")
    ),
    dateFrom: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
    dateTo: z.preprocess(emptyToUndefined, dateOnlySchema.optional()),
  })
  .superRefine((value, ctx) => {
    if (value.range === "custom" && (!value.dateFrom || !value.dateTo)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "Custom reports require a start and end date.",
      });
      return;
    }

    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Date range end must be on or after the start date.",
      });
      return;
    }

    if (value.range === "custom" && value.dateFrom && value.dateTo) {
      const from = parseDateOnly(value.dateFrom);
      const to = parseDateOnly(value.dateTo);
      const dayCount = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      if (dayCount > MAX_CUSTOM_ANALYTICS_DAYS) {
        ctx.addIssue({
          code: "custom",
          path: ["dateTo"],
          message: "Custom reports are limited to 366 days.",
        });
      }
    }
  });

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function resolvePresetRange(range: AdminReportRange): Pick<AdminReportFilters, "dateFrom" | "dateTo"> {
  const today = parseDateOnly(formatDateOnly(new Date()));

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

function getSearchValue(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
) {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminReportFilters(
  source: URLSearchParams | Record<string, string | string[] | undefined>
): AdminReportFilters {
  const parsed = adminReportFilterSchema.safeParse({
    range: getSearchValue(source, "range"),
    dateFrom: getSearchValue(source, "dateFrom"),
    dateTo: getSearchValue(source, "dateTo"),
  });

  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  if (parsed.data.range === "custom") {
    return {
      range: parsed.data.range,
      dateFrom: parsed.data.dateFrom!,
      dateTo: parsed.data.dateTo!,
    };
  }

  return { range: parsed.data.range, ...resolvePresetRange(parsed.data.range) };
}
