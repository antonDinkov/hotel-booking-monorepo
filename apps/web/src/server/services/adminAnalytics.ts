import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { formatDateOnly, parseDateOnly } from "@/lib/date-only";
import { getAdminReports } from "@/server/services/adminReports";
import type { AdminAnalyticsResult } from "@/types/admin-analytics";
import type {
  AdminReportDistributionPoint,
  AdminReportFilters,
} from "@/types/admin-reports";

const PAYMENT_STATUS_LABELS = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function paymentTone(status: string): AdminReportDistributionPoint["tone"] {
  if (status === "paid") return "blue";
  if (status === "pending" || status === "refund_pending") return "amber";
  if (status === "failed" || status === "cancelled" || status === "refunded") return "red";
  return "neutral";
}

function dateEndExclusive(dateTo: string): string {
  const date = parseDateOnly(dateTo);
  date.setDate(date.getDate() + 1);
  return formatDateOnly(date);
}

async function getPaymentStatusDistribution(
  filters: AdminReportFilters
): Promise<AdminReportDistributionPoint[]> {
  const result = await db.execute<{ label: string; value: number }>(sql`
    select coalesce(payment_status, 'pending') as label, count(*)::int as value
    from bookings
    where created_at >= ${filters.dateFrom}::date
      and created_at < ${dateEndExclusive(filters.dateTo)}::date
    group by 1
  `);
  const values = new Map(result.rows.map((row) => [row.label, toNumber(row.value)]));

  return PAYMENT_STATUS_LABELS.map((label) => ({
    label,
    value: values.get(label) ?? 0,
    tone: paymentTone(label),
  }));
}

export async function getAdminAnalytics(
  filters: AdminReportFilters
): Promise<AdminAnalyticsResult> {
  const [reports, paymentStatusDistribution] = await Promise.all([
    getAdminReports(filters),
    getPaymentStatusDistribution(filters),
  ]);

  return { ...reports, paymentStatusDistribution };
}
