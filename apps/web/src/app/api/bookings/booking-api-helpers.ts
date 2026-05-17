import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseAdminBookingFilters,
  parseAdminBookingUpdate,
} from "@/lib/admin-booking-validation";
import {
  parsePartnerBookingFilters,
  parsePartnerBookingStatusUpdate,
} from "@/lib/partner-booking-validation";
import type {
  AdminBookingFilters,
  AdminBookingUpdateInput,
} from "@/types/admin-bookings";
import type {
  PartnerBookingFilters,
  PartnerBookingStatusUpdateInput,
} from "@/types/partner-booking";

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

const confirmStripeSessionSchema = z.object({
  sessionId: z.string().min(1),
});

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

export function parsePartnerBookingQuery(
  searchParams: URLSearchParams
): PartnerBookingFilters {
  return parsePartnerBookingFilters(searchParams);
}

export function parseAdminBookingQuery(
  searchParams: URLSearchParams
): AdminBookingFilters {
  return parseAdminBookingFilters(searchParams);
}

export async function parsePartnerBookingStatusRequest(
  request: Request
): Promise<PartnerBookingStatusUpdateInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }

  return parsePartnerBookingStatusUpdate(body);
}

export async function parseAdminBookingStatusRequest(
  request: Request
): Promise<AdminBookingUpdateInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }

  return parseAdminBookingUpdate(body);
}

export function parseConfirmStripeSessionBody(body: unknown) {
  return confirmStripeSessionSchema.safeParse(body);
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

export function mapStripeConfirmationError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "BOOKING_NOT_PENDING") return apiError("Booking is not awaiting payment", code, 400);
  if (code === "BOOKING_MISMATCH") return apiError("Stripe session does not match this booking", code, 400);
  if (code === "FORBIDDEN_BOOKING_ACCESS") return apiError("Forbidden", code, 403);
  if (code === "PAYMENT_NOT_COMPLETED") return apiError("Payment is not completed yet", code, 409);
  if (code === "STRIPE_SESSION_NOT_FOUND") return apiError("Stripe session not found", code, 404);
  if (code === "STRIPE_PAYMENT_INTENT_MISSING") return apiError("Stripe payment reference is missing", code, 500);
  if (code === "STRIPE_SECRET_KEY_MISSING") return apiError("Stripe is not configured", code, 500);

  console.error("Stripe confirmation failed:", error);
  return apiError("Failed to confirm Stripe payment", "STRIPE_CONFIRM_FAILED", 500);
}

export function mapCancelBookingError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "BOOKING_NOT_CANCELLABLE") return apiError("Booking cannot be cancelled automatically", code, 400);
  if (code === "BOOKING_ALREADY_STARTED") {
    return apiError(
      "This booking has already started and cannot be cancelled automatically. Please contact support or the hotel.",
      code,
      400
    );
  }
  if (code === "BOOKING_REFUND_PAYMENT_INTENT_MISSING" || code === "STRIPE_REFUND_FAILED") {
    return apiError("Refund could not be processed automatically. Please contact support.", code, 502);
  }
  if (code === "STRIPE_SECRET_KEY_MISSING") return apiError("Stripe is not configured", code, 500);

  console.error("Booking cancellation failed:", error);
  return apiError("Failed to cancel booking", "BOOKING_CANCEL_FAILED", 500);
}

export function mapPartnerBookingError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") {
    return apiError("Missing or invalid booking fields", code, 400);
  }
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") return apiError("Partner profile not found", code, 403);
  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "INVALID_STATUS_TRANSITION") {
    return apiError("This booking status transition is not allowed", code, 400);
  }

  console.error("Partner booking request failed:", error);
  return apiError("Partner booking request failed", "PARTNER_BOOKING_REQUEST_FAILED", 500);
}

export function mapAdminBookingError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") return apiError("Missing or invalid booking fields", code, 400);
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "INVALID_BOOKING_ID") return apiError("Invalid booking ID", code, 400);
  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);

  console.error("Admin booking request failed:", error);
  return apiError("Admin booking request failed", "ADMIN_BOOKING_REQUEST_FAILED", 500);
}
