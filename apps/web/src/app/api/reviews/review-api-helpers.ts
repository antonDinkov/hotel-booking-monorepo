import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parsePartnerReviewFilters,
  parsePartnerReviewReply,
} from "@/lib/partner-review-validation";
import type {
  PartnerReviewFilters,
  PartnerReviewReplyInput,
} from "@/types/partner-review";

const createReviewSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

const reviewPageQuerySchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(24).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function authError(status?: number) {
  return status === 401
    ? apiError("Unauthorized", "UNAUTHORIZED", 401)
    : apiError("Forbidden", "FORBIDDEN", 403);
}

export function parseCreateReviewBody(body: unknown) {
  return createReviewSchema.safeParse(body);
}

export function parseReviewId(id: string) {
  const reviewId = Number(id);
  return Number.isInteger(reviewId) && reviewId > 0 ? reviewId : null;
}

export function parseReviewPageQuery(searchParams: URLSearchParams) {
  return reviewPageQuerySchema.safeParse({
    hotelId: searchParams.get("hotelId"),
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
}

export function parsePartnerReviewQuery(
  searchParams: URLSearchParams
): PartnerReviewFilters {
  return parsePartnerReviewFilters(searchParams);
}

export async function parsePartnerReviewReplyRequest(
  request: Request
): Promise<PartnerReviewReplyInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }

  return parsePartnerReviewReply(body);
}

export function mapReviewError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "INVALID_HOTEL_ID") return apiError("Invalid hotel ID", code, 400);
  if (code === "INVALID_BOOKING_ID") return apiError("Invalid booking ID", code, 400);
  if (code === "INVALID_RATING") return apiError("Rating must be between 1 and 5", code, 400);
  if (code === "INVALID_COMMENT") return apiError("Review comment is invalid", code, 400);
  if (code === "CLIENT_ROLE_REQUIRED") return apiError("Forbidden", "FORBIDDEN", 403);
  if (code === "BOOKING_NOT_FOUND") return apiError("Booking not found", code, 404);
  if (code === "FORBIDDEN_BOOKING_ACCESS") return apiError("Forbidden", code, 403);
  if (code === "BOOKING_NOT_COMPLETED") return apiError("Only completed bookings can be reviewed", code, 400);
  if (code === "REVIEW_ALREADY_EXISTS") return apiError("This booking already has a review", code, 409);

  console.error("Review operation failed:", error);
  return apiError("Review operation failed", "REVIEW_OPERATION_FAILED", 500);
}

export function mapPartnerReviewError(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (code === "VALIDATION_ERROR") return apiError("Missing or invalid review fields", code, 400);
  if (code === "INVALID_JSON") return apiError("Invalid JSON body", code, 400);
  if (code === "PARTNER_PROFILE_NOT_FOUND") return apiError("Partner profile not found", code, 403);
  if (code === "REVIEW_NOT_FOUND") return apiError("Review not found", code, 404);

  console.error("Partner review operation failed:", error);
  return apiError("Partner review operation failed", "PARTNER_REVIEW_OPERATION_FAILED", 500);
}
