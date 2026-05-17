import type { BookingPaymentStatus } from "@/types/booking";
import type { PartnerBadgeTone } from "@/types/partner";

export type PartnerDashboardBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

/**
 * Aggregate KPI values shown on the partner dashboard.
 */
export type PartnerDashboardMetrics = {
  totalHotels: number;
  totalRoomTypes: number;
  totalRoomInventory: number;
  totalBookings: number;
  upcomingBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageOccupancyRate: number;
  averageReviewRating: number | null;
  totalReviews: number;
  unrepliedReviewsCount: number;
  occupancyBookedRoomNights: number;
  occupancyAvailableRoomNights: number;
};

export type PartnerDashboardChartPoint = {
  label: string;
  value: number;
};

export type PartnerDashboardRange = {
  today: string;
  monthStart: string;
  monthEnd: string;
  occupancyStart: string;
  occupancyEnd: string;
  trendStart: string;
  trendEnd: string;
};

export type PartnerDashboardRecentBooking = {
  id: number;
  guestFullName: string;
  hotelName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: PartnerDashboardBookingStatus;
  paymentStatus: BookingPaymentStatus;
  totalPrice: number;
};

export type PartnerDashboardUpcomingCheckIn = {
  id: number;
  guestFullName: string;
  hotelName: string;
  roomTypeName: string;
  checkInDate: string;
  guestsCount: number;
  roomsCount: number;
};

export type PartnerDashboardRecentReview = {
  id: number;
  guestFullName: string;
  hotelName: string;
  rating: number;
  commentPreview: string;
  replyStatus: "replied" | "not_replied";
  createdAt: string;
};

export type PartnerDashboardHotelPerformance = {
  hotelId: number;
  hotelName: string;
  roomTypeCount: number;
  roomInventory: number;
  imageCount: number;
  bookingsCount: number;
  revenue: number;
  occupancyRate: number;
  averageRating: number | null;
  totalReviews: number;
};

export type PartnerDashboardSummaryCard = {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  tone: PartnerBadgeTone;
};

/**
 * Complete database-backed payload consumed by /partner/dashboard.
 */
export type PartnerDashboardResult = {
  generatedAt: string;
  metrics: PartnerDashboardMetrics;
  recentBookings: PartnerDashboardRecentBooking[];
  upcomingCheckIns: PartnerDashboardUpcomingCheckIn[];
  recentReviews: PartnerDashboardRecentReview[];
  revenueTrend: PartnerDashboardChartPoint[];
  occupancyTrend: PartnerDashboardChartPoint[];
  hotelPerformance: PartnerDashboardHotelPerformance[];
};

export type PartnerDashboardViewProps = {
  dashboard: PartnerDashboardResult;
};

export type PartnerDashboardRecentBookingListProps = {
  bookings: PartnerDashboardRecentBooking[];
};

export type PartnerDashboardRecentBookingItemProps = {
  booking: PartnerDashboardRecentBooking;
};

export type PartnerDashboardUpcomingCheckInListProps = {
  checkIns: PartnerDashboardUpcomingCheckIn[];
};

export type PartnerDashboardUpcomingCheckInItemProps = {
  booking: PartnerDashboardUpcomingCheckIn;
};

export type PartnerDashboardRecentReviewListProps = {
  reviews: PartnerDashboardRecentReview[];
};

export type PartnerDashboardRecentReviewItemProps = {
  review: PartnerDashboardRecentReview;
};

export type PartnerDashboardHotelPerformanceListProps = {
  hotels: PartnerDashboardHotelPerformance[];
};

export type PartnerDashboardHotelPerformanceItemProps = {
  hotel: PartnerDashboardHotelPerformance;
};

export type PartnerDashboardSectionLinkProps = {
  href: string;
  label: string;
};

export type PartnerDashboardPerformanceRowProps = {
  label: string;
  value: string;
};

export type PartnerDashboardSummaryRow = {
  total_hotels: number;
  total_room_types: number;
  total_room_inventory: number;
  total_bookings: number;
  upcoming_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  total_revenue: string | number | null;
  revenue_this_month: string | number | null;
  average_occupancy_rate: string | number | null;
  average_review_rating: string | number | null;
  total_reviews: number;
  unreplied_reviews_count: number;
  occupancy_booked_room_nights: string | number | null;
  occupancy_available_room_nights: string | number | null;
};

export type PartnerDashboardDailyMetricRow = {
  label: string;
  value: string | number | null;
};

export type PartnerDashboardBookingRow = {
  id: number;
  userEmail: string;
  guestFullName: string | null;
  hotelName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number | null;
  status: string | null;
  paymentStatus: string | null;
  pricePerNight: number;
};

export type PartnerDashboardReviewRow = {
  id: number;
  userEmail: string;
  guestFullName: string | null;
  hotelName: string;
  rating: number;
  comment: string | null;
  partnerReply: string | null;
  createdAt: Date | string | null;
};

export type PartnerDashboardHotelPerformanceRow = {
  hotel_id: number;
  hotel_name: string;
  room_type_count: number;
  room_inventory: number;
  image_count: number;
  bookings_count: number;
  revenue: string | number | null;
  occupancy_rate: string | number | null;
  average_rating: string | number | null;
  total_reviews: number;
};
