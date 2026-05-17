import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
} from "@/types/booking";

export type PartnerBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PartnerBookingSort = "newest" | "check_in" | "check_out";

export type PartnerBookingStatusFilter = PartnerBookingStatus | "all";

export type PartnerBookingPaymentStatusFilter =
  | BookingPaymentStatus
  | "all";

export type PartnerBookingFilters = {
  status?: PartnerBookingStatus;
  paymentStatus?: BookingPaymentStatus;
  hotelId?: number;
  dateFrom?: string;
  dateTo?: string;
  sort: PartnerBookingSort;
  page: number;
  pageSize: number;
};

export type PartnerBookingHotelOption = {
  id: number;
  name: string;
};

export type PartnerBookingPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Joined booking row selected by the partner booking service.
 */
export type PartnerBookingRow = {
  id: number;
  roomTypeId: number;
  hotelId: number;
  userEmail: string;
  guestFullName: string | null;
  guestPhone: string | null;
  hotelName: string;
  hotelLocation: string;
  hotelDescription: string | null;
  roomTypeName: string;
  roomCapacity: number;
  totalRooms: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number | null;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string | null;
  pricePerNight: number;
};

/**
 * Row displayed in the partner booking operations table.
 */
export type PartnerBookingListItem = {
  id: number;
  guestFullName: string;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestsCount: number;
  roomsCount: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: PartnerBookingStatus;
  paymentMethod: BookingPaymentMethod | null;
  paymentStatus: BookingPaymentStatus;
  pricePerNight: number;
  totalPrice: number;
  createdAt: string | null;
};

export type PartnerBookingListResult = {
  bookings: PartnerBookingListItem[];
  hotels: PartnerBookingHotelOption[];
  filters: PartnerBookingFilters;
  pagination: PartnerBookingPagination;
};

export type PartnerBookingStripeFields = {
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
};

/**
 * Full booking record shown to the owning partner on the detail page.
 */
export type PartnerBookingDetails = PartnerBookingListItem &
  PartnerBookingStripeFields & {
    guestEmail: string;
    guestPhone: string | null;
    hotelLocation: string;
    hotelDescription: string | null;
    roomCapacity: number;
    totalRooms: number;
    roomImageUrls: string[];
    hotelCoverImageUrl: string | null;
    expiresAt: string | null;
  };

export type PartnerBookingStatusUpdateInput = {
  status: PartnerBookingStatus;
};

export type PartnerBookingStatusUpdateResult = {
  id: number;
  status: PartnerBookingStatus;
};

export type PartnerBookingStatusUpdatePayload = {
  data?: PartnerBookingStatusUpdateResult;
  error?: {
    message?: string;
    code?: string;
  };
};

export type PartnerBookingActionNotice = {
  tone: "success" | "error";
  message: string;
};

export type PartnerBookingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export type PartnerBookingsClientProps = {
  initialResult: PartnerBookingListResult;
};

export type PartnerBookingDetailClientProps = {
  booking: PartnerBookingDetails;
};

export type PartnerBookingApiRouteContext = {
  params: Promise<{
    id: string;
  }>;
};
