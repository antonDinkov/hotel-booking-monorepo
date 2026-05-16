import type {
  AdminAccountStatus,
  AdminBadgeTone,
  AdminModerationStatus,
  AdminPaymentStatus,
  AdminReport,
  AdminReviewCase,
  AdminSeverity,
} from "@/types/admin";
import { partnerHotelHref } from "./admin-mock-data";

export function accountStatusTone(status: AdminAccountStatus): AdminBadgeTone {
  if (status === "active") return "blue";
  if (status === "suspended") return "red";
  return "amber";
}

export function moderationStatusTone(status: AdminModerationStatus): AdminBadgeTone {
  if (status === "approved") return "blue";
  if (status === "pending" || status === "flagged") return "amber";
  if (status === "rejected" || status === "suspended") return "red";
  return "neutral";
}

export function paymentStatusTone(status: AdminPaymentStatus): AdminBadgeTone {
  if (status === "paid") return "blue";
  if (status === "pending") return "amber";
  if (status === "failed" || status === "refunded" || status === "disputed") {
    return "red";
  }
  return "neutral";
}

export function severityTone(severity: AdminSeverity): AdminBadgeTone {
  if (severity === "critical" || severity === "high") return "red";
  if (severity === "medium") return "amber";
  return "neutral";
}

export function reviewStatusTone(status: AdminReviewCase["status"]): AdminBadgeTone {
  if (status === "hidden" || status === "reported") return "red";
  if (status === "low_rating" || status === "pending") return "amber";
  return "neutral";
}

export function reportSubjectHref(report: AdminReport) {
  if (report.type === "hotel") return partnerHotelHref(report.subjectId);
  if (report.type === "user") return `/admin/users/${report.subjectId}`;
  return `/admin/reviews?case=${report.subjectId}`;
}
