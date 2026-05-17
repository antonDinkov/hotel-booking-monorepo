import type { AdminPagination } from "@/types/admin";
import type { AdminBookingStatus } from "@/types/admin-bookings";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

export type AdminPaymentSort =
  | "newest"
  | "oldest"
  | "amount_desc"
  | "amount_asc"
  | "payment_status";

export type AdminPaymentFilters = {
  paymentStatus?: BookingPaymentStatus;
  paymentMethod?: BookingPaymentMethod;
  bookingStatus?: AdminBookingStatus;
  hotelId?: number;
  partnerId?: string;
  createdFrom?: string;
  createdTo?: string;
  sort: AdminPaymentSort;
  page: number;
  pageSize: number;
};

export type AdminPaymentOption = {
  id: number | string;
  name: string;
};

/**
 * Booking-backed payment row shown in the admin finance table.
 */
export type AdminPaymentListItem = {
  bookingId: number;
  guestUserId: string;
  guestName: string;
  guestEmail: string;
  hotelId: number;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeId: number;
  roomTypeName: string;
  paymentMethod: BookingPaymentMethod | null;
  paymentStatus: BookingPaymentStatus;
  rawPaymentStatus: string | null;
  bookingStatus: AdminBookingStatus;
  rawBookingStatus: string | null;
  totalAmount: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  createdAt: string | null;
};

export type AdminPaymentSummary = {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  refundPending: number;
  paidRevenue: number;
  refundExposure: number;
  stripeMissingIntent: number;
};

export type AdminPaymentListResult = {
  payments: AdminPaymentListItem[];
  hotels: AdminPaymentOption[];
  partners: AdminPaymentOption[];
  summary: AdminPaymentSummary;
  filters: AdminPaymentFilters;
  pagination: AdminPagination;
};

export type AdminPaymentsClientProps = {
  result: AdminPaymentListResult;
};
