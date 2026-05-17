import type { PartnerBadgeTone } from "@/types/partner";

export type PartnerAnalyticsRangePreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

export type PartnerAnalyticsBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PartnerAnalyticsFilters = {
  range: PartnerAnalyticsRangePreset;
  dateFrom: string;
  dateTo: string;
  hotelId?: number;
  roomTypeId?: number;
  status?: PartnerAnalyticsBookingStatus;
};

export type PartnerAnalyticsHotelOption = {
  id: number;
  name: string;
};

export type PartnerAnalyticsRoomTypeOption = {
  id: number;
  hotelId: number;
  hotelName: string;
  name: string;
};

export type PartnerAnalyticsOptions = {
  hotels: PartnerAnalyticsHotelOption[];
  roomTypes: PartnerAnalyticsRoomTypeOption[];
};

/**
 * Single chart bucket produced by service-level SQL aggregations.
 */
export type PartnerAnalyticsChartPoint = {
  label: string;
  value: number;
};

export type PartnerAnalyticsDistributionPoint = PartnerAnalyticsChartPoint & {
  tone: PartnerBadgeTone;
};

export type PartnerAnalyticsRankingItem = {
  id: number;
  name: string;
  value: number;
  detail?: string;
};

/**
 * Top-level KPI values shown in the partner analytics dashboard.
 */
export type PartnerAnalyticsSummary = {
  totalBookings: number;
  totalRevenue: number;
  averageOccupancyRate: number;
  averageReviewRating: number | null;
  totalReviews: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  activeHotels: number;
  totalRoomInventory: number;
};

export type PartnerRevenueAnalytics = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  daily: PartnerAnalyticsChartPoint[];
  weekly: PartnerAnalyticsChartPoint[];
  monthly: PartnerAnalyticsChartPoint[];
};

export type PartnerBookingAnalytics = {
  daily: PartnerAnalyticsChartPoint[];
  weekly: PartnerAnalyticsChartPoint[];
  monthly: PartnerAnalyticsChartPoint[];
  statusDistribution: PartnerAnalyticsDistributionPoint[];
  byHotel: PartnerAnalyticsRankingItem[];
  byRoomType: PartnerAnalyticsRankingItem[];
};

export type PartnerOccupancyAnalytics = {
  averageRate: number;
  trend: PartnerAnalyticsChartPoint[];
  mostOccupiedHotels: PartnerAnalyticsRankingItem[];
  leastOccupiedHotels: PartnerAnalyticsRankingItem[];
  byRoomType: PartnerAnalyticsRankingItem[];
};

export type PartnerReviewAnalytics = {
  averageRating: number | null;
  totalReviews: number;
  trend: PartnerAnalyticsChartPoint[];
  ratingDistribution: PartnerAnalyticsDistributionPoint[];
  bestRatedHotels: PartnerAnalyticsRankingItem[];
  lowestRatedHotels: PartnerAnalyticsRankingItem[];
};

/**
 * Complete payload consumed by the interactive partner analytics client.
 */
export type PartnerAnalyticsResult = {
  filters: PartnerAnalyticsFilters;
  options: PartnerAnalyticsOptions;
  summary: PartnerAnalyticsSummary;
  revenue: PartnerRevenueAnalytics;
  bookings: PartnerBookingAnalytics;
  occupancy: PartnerOccupancyAnalytics;
  reviews: PartnerReviewAnalytics;
};

export type PartnerAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type PartnerAnalyticsClientProps = {
  initialResult: PartnerAnalyticsResult;
};
