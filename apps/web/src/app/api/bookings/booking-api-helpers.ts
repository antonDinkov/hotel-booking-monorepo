import { NextResponse } from "next/server";
import { z } from "zod";

const createBookingHoldSchema = z
  .object({
    hotelId: z.coerce.number().int().positive(),
    roomTypeId: z.coerce.number().int().positive(),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guestsCount: z.coerce.number().int().positive(),
    roomsCount: z.coerce.number().int().positive().optional(),
    rooms: z.coerce.number().int().positive().optional(),
  })
  .transform((data) => ({ ...data, roomsCount: data.roomsCount ?? data.rooms ?? 1 }));

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function authError(status?: number) {
  return status === 401
    ? apiError("Unauthorized", "UNAUTHORIZED", 401)
    : apiError("Forbidden", "FORBIDDEN", 403);
}

export function parseBookingId(id: string) {
  const bookingId = Number(id);
  return Number.isInteger(bookingId) && bookingId > 0 ? bookingId : null;
}

export function parseCreateBookingHoldBody(body: unknown) {
  return createBookingHoldSchema.safeParse(body);
}

export function mapCreateBookingError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "NO_AVAILABILITY") return apiError("Selected room is no longer available", code, 400);
  if (code === "ROOM_TYPE_NOT_FOUND") return apiError("Selected room type was not found", code, 404);
  if (code === "INVALID_DATES" || code === "INVALID_GUESTS" || code === "INVALID_ROOMS") {
    return apiError("Invalid booking details", code, 400);
  }

  console.error("Create booking hold failed:", error);
  return apiError("Failed to create booking hold", "CREATE_BOOKING_HOLD_FAILED", 500);
}

export function mapCashOnArrivalError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "BOOKING_EXPIRED") return apiError("Booking hold has expired", code, 400);
  if (code === "BOOKING_NOT_PENDING") return apiError("Booking is not awaiting payment", code, 400);
  if (code === "CASH_ON_ARRIVAL_NOT_SUPPORTED") {
    return apiError("Cash on arrival is not supported by this hotel", code, 400);
  }

  console.error("Cash on arrival confirmation failed:", error);
  return apiError("Failed to confirm cash on arrival booking", "CASH_CONFIRM_FAILED", 500);
}

export function mapStripeCheckoutError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "BOOKING_EXPIRED") return apiError("Booking hold has expired", code, 400);
  if (code === "BOOKING_NOT_PENDING") return apiError("Booking is not awaiting payment", code, 400);
  if (code === "STRIPE_NOT_SUPPORTED") return apiError("Card payment is not supported by this hotel", code, 400);
  if (code === "STRIPE_SECRET_KEY_MISSING") return apiError("Stripe is not configured", code, 500);

  console.error("Stripe Checkout creation failed:", error);
  return apiError("Failed to start Stripe Checkout", "STRIPE_CHECKOUT_FAILED", 500);
}
