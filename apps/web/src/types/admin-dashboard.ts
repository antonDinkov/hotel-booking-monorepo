import type { AdminBadgeTone, AdminStatCardProps } from "@/types/admin";
import type { AdminPartnerVerificationStatus } from "@/types/admin-partners";
import type { AdminSystemCheck } from "@/types/admin-system";
import type { BookingPaymentStatus } from "@/types/booking";
import type {
  AdminReportChartPoint,
  AdminReportDistributionPoint,
} from "@/types/admin-reports";
import type { ReviewModerationStatus } from "@/types/review";

export type AdminDashboardMetrics = {
  totalUsers: number;
  totalClients: number;
  totalPartners: number;
  pendingPartners: number;
  verifiedPartners: number;
  totalHotels: number;
  totalRoomTypes: number;
  totalRoomInventory: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageOccupancyRate: number;
  averageReviewRating: number | null;
  totalReviews: number;
  hiddenReviews: number;
  publishedReviews: number;
  recentPaymentsCount: number;
};

export type AdminDashboardRecentUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string | null;
};

export type AdminDashboardPartner = {
  id: string;
  companyName: string;
  representativeName: string;
  email: string;
  verificationStatus: AdminPartnerVerificationStatus;
  isVerified: boolean;
  createdAt: string | null;
};

export type AdminDashboardRecentBooking = {
  id: number;
  guestUserId: string;
  guestFullName: string;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  paymentStatus: BookingPaymentStatus;
  totalPrice: number;
  createdAt: string | null;
};

export type AdminDashboardRecentReview = {
  id: number;
  userId: string;
  guestFullName: string;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  rating: number;
  commentPreview: string;
  moderationStatus: ReviewModerationStatus;
  hasPartnerReply: boolean;
  createdAt: string;
};

export type AdminDashboardSummaryItem = {
  label: string;
  value: number;
  tone: AdminBadgeTone;
};

/**
 * Complete database-backed payload rendered by the admin dashboard overview.
 */
export type AdminDashboardResult = {
  generatedAt: string;
  rangeLabel: string;
  metrics: AdminDashboardMetrics;
  statCards: AdminStatCardProps[];
  recentUsers: AdminDashboardRecentUser[];
  recentPartners: AdminDashboardPartner[];
  pendingPartnerApprovals: AdminDashboardPartner[];
  recentBookings: AdminDashboardRecentBooking[];
  recentReviews: AdminDashboardRecentReview[];
  revenueTrend: AdminReportChartPoint[];
  bookingStatusSummary: AdminReportDistributionPoint[];
  reviewModerationSummary: AdminDashboardSummaryItem[];
  systemHealth: AdminSystemCheck[];
};
