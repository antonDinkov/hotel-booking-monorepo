import type { AdminBadgeTone } from "@/types/admin";

export type AdminReportRange =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

export type AdminReportFilters = {
  range: AdminReportRange;
  dateFrom: string;
  dateTo: string;
};

export type AdminReportMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: AdminBadgeTone;
};

export type AdminReportChartPoint = {
  label: string;
  value: number;
};

export type AdminReportDistributionPoint = {
  label: string;
  value: number;
  tone: AdminBadgeTone;
};

export type AdminReportRankingItem = {
  id: number | string;
  name: string;
  value: number;
  detail: string;
};

export type AdminReportSummary = {
  totalUsers: number;
  totalClients: number;
  totalPartners: number;
  verifiedPartners: number;
  pendingPartners: number;
  totalHotels: number;
  totalRoomInventory: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageOccupancy: number;
  averageReviewRating: number | null;
  totalReviews: number;
  hiddenReviews: number;
};

export type AdminOccupancySummary = {
  averageRate: number;
  bookedRoomNights: number;
  availableRoomNights: number;
  daily: AdminReportChartPoint[];
};

export type AdminReportsResult = {
  filters: AdminReportFilters;
  metrics: AdminReportMetric[];
  summary: AdminReportSummary;
  revenueOverTime: AdminReportChartPoint[];
  bookingsOverTime: AdminReportChartPoint[];
  bookingStatusDistribution: AdminReportDistributionPoint[];
  partnerVerificationDistribution: AdminReportDistributionPoint[];
  topHotelsByBookings: AdminReportRankingItem[];
  topPartnersByRevenue: AdminReportRankingItem[];
  reviewRatingDistribution: AdminReportDistributionPoint[];
  occupancySummary: AdminOccupancySummary;
};

export type AdminReportsClientProps = {
  result: AdminReportsResult;
};
