import type { BookingPaymentMethod, BookingPaymentStatus } from "./payment";

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed" | "expired";
export type BookingLifecycleStatus = BookingStatus;
export type BookingDisplayStatus = "upcoming" | "active" | "past" | "cancelled";
export type CancelledBookingBadge = string;

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

export type MyBooking = {
  id: string;
  hotelId?: number;
  hotelName: string;
  hotelAddress?: string;
  hotelImage?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guestsCount?: number;
  roomsCount?: number;
  totalPrice: number;
  status: BookingDisplayStatus;
  lifecycleStatus?: BookingLifecycleStatus;
  paymentMethod?: BookingPaymentMethod | null;
  paymentStatus?: BookingPaymentStatus;
  cancelledBadge?: CancelledBookingBadge;
  canCancel?: boolean;
  canReview?: boolean;
  hasReview?: boolean;
  reviewId?: number;
  daysRemaining?: number;
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

export type BookingConfirmation = Omit<BookingSummary, "supportedPaymentMethods">;
