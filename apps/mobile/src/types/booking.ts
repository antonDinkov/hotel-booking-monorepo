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
