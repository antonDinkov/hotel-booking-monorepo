export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
export type BookingLifecycleStatus = BookingStatus;
export type BookingDisplayStatus = 'upcoming' | 'active' | 'past' | 'cancelled';
export type BookingPaymentMethod = 'stripe' | 'cash_on_arrival';
export type BookingPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'refund_denied';

export type CancelledBookingBadge = string;

export type MyBooking = {
  canCancel?: boolean;
  canReview?: boolean;
  cancelledBadge?: CancelledBookingBadge;
  checkIn: string;
  checkOut: string;
  daysRemaining?: number;
  guestsCount?: number;
  hasReview?: boolean;
  hotelAddress?: string;
  hotelId?: number;
  hotelImage?: string;
  hotelName: string;
  id: string;
  lifecycleStatus?: BookingLifecycleStatus;
  paymentMethod?: BookingPaymentMethod | null;
  paymentStatus?: BookingPaymentStatus;
  reviewId?: number;
  roomsCount?: number;
  roomType: string;
  status: BookingDisplayStatus;
  totalPrice: number;
};

export type ClientBookingsPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ClientBookingsPage = {
  activeBooking: MyBooking | null;
  inactiveBookings: MyBooking[];
  pagination: ClientBookingsPagination;
};

export type BookingCancellationNotice = {
  title: string;
  message: string;
};

export type CancelBookingResult = {
  bookingId: number;
  status: BookingLifecycleStatus;
  paymentMethod: BookingPaymentMethod | null;
  paymentStatus: BookingPaymentStatus;
  stripeRefundId?: string | null;
  notification: BookingCancellationNotice;
};

export type CreateBookingHoldRequest = {
  hotelId: number;
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number;
};

export type CreateBookingHoldResponse = {
  bookingId: number;
  expiresAt: string;
};

export type BookingSummary = {
  bookingId: number;
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  hotelLocation: string;
  roomType: string;
  roomCapacity: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number;
  nights: number;
  pricePerNight: number;
  totalPrice: number;
  paymentMethod: BookingPaymentMethod | null;
  paymentStatus: BookingPaymentStatus;
  status: BookingLifecycleStatus;
  expiresAt: string | null;
  supportedPaymentMethods: BookingPaymentMethod[];
};
