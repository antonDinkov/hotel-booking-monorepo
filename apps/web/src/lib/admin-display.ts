import type {
  AdminAccountStatus,
  AdminBadgeTone,
  AdminModerationStatus,
  AdminReport,
  AdminReviewCase,
  AdminSeverity,
} from "@/types/admin";
import type { AdminPartnerVerificationStatus } from "@/types/admin-partners";
import { partnerHotelHref } from "./admin-mock-data";

export function accountStatusTone(status: AdminAccountStatus): AdminBadgeTone {
  if (status === "active") return "blue";
  if (status === "suspended") return "red";
  return "amber";
}

export function activeStatusTone(isActive: boolean): AdminBadgeTone {
  return isActive ? "blue" : "red";
}

export function verificationStatusTone(
  status: AdminPartnerVerificationStatus
): AdminBadgeTone {
  if (status === "verified") return "blue";
  if (status === "pending") return "amber";
  return "red";
}

export function moderationStatusTone(status: AdminModerationStatus): AdminBadgeTone {
  if (status === "approved") return "blue";
  if (status === "pending" || status === "flagged") return "amber";
  if (status === "rejected" || status === "suspended") return "red";
  return "neutral";
}

export function paymentStatusTone(status: string): AdminBadgeTone {
  if (status === "paid") return "blue";
  if (status === "pending" || status === "refund_pending") return "amber";
  if (
    status === "failed" ||
    status === "cancelled" ||
    status === "refunded" ||
    status === "refund_denied" ||
    status === "disputed"
  ) {
    return "red";
  }
  return "neutral";
}

export function bookingStatusTone(status: string): AdminBadgeTone {
  if (status === "confirmed" || status === "completed") return "blue";
  if (status === "cancelled" || status === "expired") return "red";
  return "amber";
}

export function reviewModerationStatusTone(status: string): AdminBadgeTone {
  if (status === "published") return "blue";
  if (status === "hidden") return "red";
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
