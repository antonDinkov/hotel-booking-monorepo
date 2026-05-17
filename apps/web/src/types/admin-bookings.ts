import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

export type AdminBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "expired";

export type AdminBookingSort =
  | "newest"
  | "check_in"
  | "check_out"
  | "total_price";

export type AdminBookingFilters = {
  status?: AdminBookingStatus;
  paymentStatus?: BookingPaymentStatus;
  hotelId?: number;
  partnerId?: string;
  guestSearch?: string;
  dateFrom?: string;
  dateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sort: AdminBookingSort;
  page: number;
  pageSize: number;
};

export type AdminBookingOption = {
  id: number | string;
  name: string;
};

export type AdminBookingCounts = {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  paid: number;
  paymentPending: number;
  failed: number;
};

export type AdminBookingPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Platform-wide booking row displayed in the admin booking table.
 */
export type AdminBookingListItem = {
  id: number;
  guestUserId: string;
  guestFullName: string;
  guestEmail: string;
  hotelId: number;
  hotelName: string;
  partnerId: string;
  partnerCompanyName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestsCount: number;
  roomsCount: number;
  status: AdminBookingStatus;
  rawStatus: string | null;
  paymentStatus: BookingPaymentStatus;
  rawPaymentStatus: string | null;
  paymentMethod: BookingPaymentMethod | null;
  totalPrice: number;
  createdAt: string | null;
};

export type AdminBookingListResult = {
  bookings: AdminBookingListItem[];
  hotels: AdminBookingOption[];
  partners: AdminBookingOption[];
  counts: AdminBookingCounts;
  filters: AdminBookingFilters;
  pagination: AdminBookingPagination;
};

/**
 * Detailed booking payload shown to admins without exposing user password data.
 */
export type AdminBookingDetails = AdminBookingListItem & {
  guestPhone: string | null;
  hotelLocation: string;
  roomCapacity: number;
  totalRooms: number;
  pricePerNight: number;
  expiresAt: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
};

export type AdminBookingUpdateInput = {
  status: AdminBookingStatus;
};

export type AdminBookingsClientProps = {
  result: AdminBookingListResult;
};

export type AdminBookingDetailClientProps = {
  booking: AdminBookingDetails;
};
