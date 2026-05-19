export type BookingPaymentMethod = "stripe" | "cash_on_arrival";

export type BookingPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "refund_denied";

export type StripeCheckoutPayload = {
  bookingId: number;
  url: string;
  expiresAt: string;
};
