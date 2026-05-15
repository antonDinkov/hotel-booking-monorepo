export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "expired";
export type BookingLifecycleStatus = BookingStatus;
export type BookingDisplayStatus = "upcoming" | "active" | "past";
export type BookingPaymentMethod = "stripe" | "cash_on_arrival";
export type BookingPaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface MyBooking {
  id: string;
  hotelName: string;
  hotelAddress?: string;
  hotelImage?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: BookingDisplayStatus;
  daysRemaining?: number;
}

export interface CreateBookingHoldRequest {
  hotelId: number;
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number;
}

export interface CreateBookingHoldResponse {
  bookingId: number;
  expiresAt: string;
}

/**
 * Server-calculated booking data used by payment and confirmation pages.
 */
export interface BookingSummary {
  bookingId: number;
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  hotelLocation: string;
  roomType: string;
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
}

export interface BookingConfirmation {
  bookingId: number;
  hotelId: number;
  roomTypeId: number;
  hotelName: string;
  hotelLocation: string;
  roomType: string;
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
}

