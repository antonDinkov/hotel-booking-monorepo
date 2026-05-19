import { and, desc, eq, gt, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { resolveImageUrl } from "@/lib/image-urls";
import { getStripe } from "@/server/lib/stripe";
import {
    calculateBookingNights,
    calculateBookingTotal,
    formatDateOnly,
    getBookingRoomsCount,
    isDateOnly as isValidDateOnly,
    parseDateOnly,
} from "@/server/services/bookingCalculations";
import { getPartnerIdForUser } from "@/server/services/partnerHotels";
import type {
    BookingConfirmation,
    BookingDisplayStatus,
    BookingPaymentMethod,
    BookingPaymentStatus,
    BookingStatus,
    BookingSummary,
    CancelBookingResult,
    CancelledBookingBadge,
    ClientBookingsPage,
    CreateBookingHoldRequest,
    CreateBookingHoldResponse,
    MyBooking,
} from "@repo/types";
import { db } from "../../db";
import { bookings, hotelImages, hotelPaymentMethods, hotels, reviews, roomTypes } from "../../db/schema";

const HOLD_MINUTES = 1;
const STRIPE_HOLD_MINUTES = 30;
const CHECKOUT_CURRENCY = "usd";
const SUPPORTED_PAYMENT_METHODS = ["stripe", "cash_on_arrival"] as const;
const PENDING_HOLD_STATUSES = ["pending_payment", "pending"] as const;
const VALID_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "refund_denied",
] as const;
const STRIPE_CANCELLED_PAYMENT_STATUSES = ["refund_pending", "refunded", "refund_denied"] as const;

type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

interface BookingRow {
  id: number;
  hotelId: number | null;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number | null;
  roomsCount: number | null;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  roomTypeName: string | null;
  roomPrice: number | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelImageUrl: string | null;
  reviewId: number | null;
}

interface ClientBookingsPageInput {
  page?: number;
  pageSize?: number;
}

interface BookingDetailsRow {
  bookingId: number;
  userId: string;
  roomTypeId: number;
  hotelId: number;
  hotelName: string;
  hotelLocation: string;
  roomType: string;
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
  pricePerNight: number;
}

interface OccupyingBooking {
  checkInDate: string;
  checkOutDate: string;
  roomsCount: number | null;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isDateOnly(value: string): boolean {
  return isValidDateOnly(value);
}

function getNightCount(checkInDate: string, checkOutDate: string): number {
  return calculateBookingNights(checkInDate, checkOutDate);
}

function formatDate(date: Date | string): string {
  return formatDateOnly(date);
}

function computeStayStatus(checkIn: Date, checkOut: Date): BookingDisplayStatus {
  const today = parseDateOnly(formatDate(new Date()));

  if (today < checkIn) {
    return "upcoming";
  }

  if (today > checkOut) {
    return "past";
  }

  return "active";
}

function computeDaysRemaining(checkOut: Date): number {
  const today = parseDateOnly(formatDate(new Date()));
  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.ceil((checkOut.getTime() - today.getTime()) / msPerDay));
}

function coerceDate(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function isSupportedMethod(method: string): method is PaymentMethod {
  return (SUPPORTED_PAYMENT_METHODS as readonly string[]).includes(method);
}

function isPendingHoldStatus(status: string | null): boolean {
  return !!status && (PENDING_HOLD_STATUSES as readonly string[]).includes(status);
}

function isBookingPaymentStatus(status: string | null): status is BookingPaymentStatus {
  return !!status && (VALID_PAYMENT_STATUSES as readonly string[]).includes(status);
}

function getStripePaymentIntentId(value: string | Stripe.PaymentIntent | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getRefundPaymentIntentId(refund: Stripe.Refund): string | null {
  return getStripePaymentIntentId(refund.payment_intent as string | Stripe.PaymentIntent | null | undefined);
}

function getChargePaymentIntentId(charge: Stripe.Charge): string | null {
  return getStripePaymentIntentId(charge.payment_intent as string | Stripe.PaymentIntent | null | undefined);
}

function canRefundBooking(row: BookingDetailsRow): boolean {
  return parseDateOnly(row.checkInDate) > parseDateOnly(formatDate(new Date()));
}

function getRefundStatus(refund: Stripe.Refund): "refund_pending" | "refunded" {
  return refund.status === "succeeded" ? "refunded" : "refund_pending";
}

function isStripeRefundStatus(status: string | null): status is "refund_pending" | "refunded" | "refund_denied" {
  return status === "refund_pending" || status === "refunded" || status === "refund_denied";
}

function normalizeBookingStatus(row: BookingDetailsRow, now = new Date()): BookingStatus {
  if (
    row.status === "confirmed" ||
    row.status === "cancelled" ||
    row.status === "completed" ||
    row.status === "expired"
  ) {
    return row.status;
  }

  const expiresAt = coerceDate(row.expiresAt);
  if (isPendingHoldStatus(row.status) && expiresAt && expiresAt > now) {
    return "pending_payment";
  }

  return "cancelled";
}

function normalizeBookingPaymentStatus(row: BookingDetailsRow, bookingStatus: BookingStatus): BookingPaymentStatus {
  if (bookingStatus === "cancelled") {
    return isBookingPaymentStatus(row.paymentStatus) ? row.paymentStatus : "cancelled";
  }

  if (bookingStatus === "confirmed" || bookingStatus === "completed") {
    if (isBookingPaymentStatus(row.paymentStatus)) {
      return row.paymentStatus;
    }

    return "pending";
  }

  if (bookingStatus === "expired") {
    return "pending";
  }

  if (isBookingPaymentStatus(row.paymentStatus)) {
    return row.paymentStatus;
  }

  return "pending";
}

function normalizeAppUrl(appUrl: string): string {
  return appUrl.replace(/\/+$/, "");
}

function validateStayInput(input: CreateBookingHoldRequest): void {
  if (!isDateOnly(input.checkInDate) || !isDateOnly(input.checkOutDate)) {
    throw new Error("INVALID_DATES");
  }

  if (parseDateOnly(input.checkOutDate) <= parseDateOnly(input.checkInDate)) {
    throw new Error("INVALID_DATES");
  }

  if (!Number.isInteger(input.guestsCount) || input.guestsCount < 1) {
    throw new Error("INVALID_GUESTS");
  }

  if (!Number.isInteger(input.roomsCount) || input.roomsCount < 1) {
    throw new Error("INVALID_ROOMS");
  }
}

function getRoomsCount(value: number | null): number {
  return getBookingRoomsCount(value);
}

function getTotalPrice(row: BookingDetailsRow): number {
  return calculateBookingTotal({
    pricePerNight: row.pricePerNight,
    roomsCount: row.roomsCount,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
  });
}

function isActivePendingHold(row: BookingDetailsRow, now = new Date()): boolean {
  const expiresAt = coerceDate(row.expiresAt);
  return isPendingHoldStatus(row.status) && Boolean(expiresAt && expiresAt > now);
}

function assertPayablePendingHold(row: BookingDetailsRow): void {
  if (!isPendingHoldStatus(row.status)) {
    throw new Error("BOOKING_NOT_PENDING");
  }

  if (!isActivePendingHold(row)) {
    throw new Error("BOOKING_EXPIRED");
  }
}

function getOccupyingStatusCondition(now: Date) {
  return or(
    eq(bookings.status, "confirmed"),
    and(or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")), gt(bookings.expiresAt, now))
  );
}

async function normalizeExpiredPendingBookings(now = new Date()): Promise<void> {
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentMethod: null,
      paymentStatus: "cancelled",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(
      and(
        or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")),
        lte(bookings.expiresAt, now)
      )
    );
}

async function expirePendingBookingHoldIfNeeded(bookingId: number, userId?: string): Promise<void> {
  const baseCondition = and(
    eq(bookings.id, bookingId),
    or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")),
    lte(bookings.expiresAt, new Date())
  );

  const condition = userId ? and(baseCondition, eq(bookings.userId, userId)) : baseCondition;

  await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentMethod: null,
      paymentStatus: "cancelled",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(condition);
}

function calculateAvailableRooms(
  totalRooms: number,
  claims: OccupyingBooking[],
  checkInDate: string,
  checkOutDate: string
): number {
  const dailyMap = new Map<string, number>();

  for (const claim of claims) {
    for (let day = parseDateOnly(claim.checkInDate); day < parseDateOnly(claim.checkOutDate); day.setDate(day.getDate() + 1)) {
      const key = formatDate(day);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + getRoomsCount(claim.roomsCount));
    }
  }

  let minAvailable = totalRooms;
  for (let day = parseDateOnly(checkInDate); day < parseDateOnly(checkOutDate); day.setDate(day.getDate() + 1)) {
    minAvailable = Math.min(minAvailable, totalRooms - (dailyMap.get(formatDate(day)) ?? 0));
  }

  return Math.max(0, minAvailable);
}

async function getAvailableRoomsForRoomType(
  roomTypeId: number,
  totalRooms: number,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId?: number
): Promise<number> {
  await normalizeExpiredPendingBookings();

  const now = new Date();
  const conditions = [
    eq(bookings.roomTypeId, roomTypeId),
    getOccupyingStatusCondition(now),
    lt(bookings.checkInDate, checkOutDate),
    gt(bookings.checkOutDate, checkInDate),
  ];

  if (excludeBookingId) {
    conditions.push(ne(bookings.id, excludeBookingId));
  }

  const claims = await db
    .select({
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomsCount: bookings.roomsCount,
    })
    .from(bookings)
    .where(and(...conditions));

  return calculateAvailableRooms(totalRooms, claims, checkInDate, checkOutDate);
}

function selectBookingDetailsRows() {
  return db
    .select({
      bookingId: bookings.id,
      userId: bookings.userId,
      roomTypeId: bookings.roomTypeId,
      hotelId: hotels.id,
      hotelName: hotels.name,
      hotelLocation: hotels.location,
      roomType: roomTypes.name,
      roomCapacity: roomTypes.capacity,
      totalRooms: roomTypes.totalRooms,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guestsCount: bookings.guestsCount,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
      stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
      stripeRefundId: bookings.stripeRefundId,
      expiresAt: bookings.expiresAt,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId));
}

async function getBookingDetails(bookingId: number, userId?: string): Promise<BookingDetailsRow | null> {
  const conditions = userId
    ? and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
    : eq(bookings.id, bookingId);

  const row = await selectBookingDetailsRows()
    .where(conditions)
    .then((rows) => rows[0]);

  return row ?? null;
}

async function getPartnerBookingDetailsForCancellation(
  bookingId: number,
  partnerId: string
): Promise<BookingDetailsRow | null> {
  const row = await selectBookingDetailsRows()
    .where(and(eq(bookings.id, bookingId), eq(hotels.partnerId, partnerId)))
    .then((rows) => rows[0]);

  return row ?? null;
}

async function getRoomTypeForHold(roomTypeId: number, hotelId: number) {
  const roomType = await db
    .select({
      id: roomTypes.id,
      hotelId: roomTypes.hotelId,
      capacity: roomTypes.capacity,
      totalRooms: roomTypes.totalRooms,
    })
    .from(roomTypes)
    .where(eq(roomTypes.id, roomTypeId))
    .then((rows) => rows[0]);

  if (!roomType || roomType.hotelId !== hotelId) {
    throw new Error("ROOM_TYPE_NOT_FOUND");
  }

  return roomType;
}

async function assertHotelSupportsMethod(hotelId: number, method: PaymentMethod): Promise<void> {
  const methods = await getHotelPaymentMethods(hotelId);

  if (!methods.includes(method)) {
    throw new Error(method === "stripe" ? "STRIPE_NOT_SUPPORTED" : "CASH_ON_ARRIVAL_NOT_SUPPORTED");
  }
}

async function mapBookingDetailsToSummary(row: BookingDetailsRow): Promise<BookingSummary> {
  const bookingStatus = normalizeBookingStatus(row);
  const supportedPaymentMethods = await getHotelPaymentMethods(row.hotelId);
  const nights = Math.max(1, getNightCount(row.checkInDate, row.checkOutDate));

  return {
    bookingId: row.bookingId,
    hotelId: row.hotelId,
    roomTypeId: row.roomTypeId,
    hotelName: row.hotelName,
    hotelLocation: row.hotelLocation,
    roomType: row.roomType,
    roomCapacity: row.roomCapacity,
    checkInDate: String(row.checkInDate),
    checkOutDate: String(row.checkOutDate),
    guestsCount: row.guestsCount,
    roomsCount: getRoomsCount(row.roomsCount),
    nights,
    pricePerNight: row.pricePerNight,
    totalPrice: getTotalPrice(row),
    paymentMethod: isSupportedMethod(row.paymentMethod ?? "") ? row.paymentMethod as BookingPaymentMethod : null,
    paymentStatus: normalizeBookingPaymentStatus(row, bookingStatus),
    status: bookingStatus,
    expiresAt: coerceDate(row.expiresAt)?.toISOString() ?? null,
    supportedPaymentMethods,
  };
}

export async function getHotelPaymentMethods(hotelId: number): Promise<PaymentMethod[]> {
  const methods = await db
    .select({ method: hotelPaymentMethods.method })
    .from(hotelPaymentMethods)
    .where(eq(hotelPaymentMethods.hotelId, hotelId));

  return methods
    .map((row) => row.method)
    .filter(isSupportedMethod)
    .filter((value, index, array) => array.indexOf(value) === index);
}

export async function createPendingBookingHold(
  input: CreateBookingHoldRequest & { userId: string }
): Promise<CreateBookingHoldResponse> {
  await normalizeExpiredPendingBookings();

  validateStayInput(input);

  const roomType = await getRoomTypeForHold(input.roomTypeId, input.hotelId);
  if (input.guestsCount > roomType.capacity * input.roomsCount) {
    throw new Error("INVALID_GUESTS");
  }

  const availableRooms = await getAvailableRoomsForRoomType(
    roomType.id,
    roomType.totalRooms,
    input.checkInDate,
    input.checkOutDate
  );

  if (availableRooms < input.roomsCount) {
    throw new Error("NO_AVAILABILITY");
  }

  const expiresAt = addMinutes(new Date(), HOLD_MINUTES);
  const inserted = await db
    .insert(bookings)
    .values({
      roomTypeId: input.roomTypeId,
      userId: input.userId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      guestsCount: input.guestsCount,
      roomsCount: input.roomsCount,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: null,
      expiresAt,
    })
    .returning({ id: bookings.id });

  return { bookingId: inserted[0].id, expiresAt: expiresAt.toISOString() };
}

export async function getBookingSummary(bookingId: number, userId: string): Promise<BookingSummary | null> {
  await expirePendingBookingHoldIfNeeded(bookingId, userId);
  const row = await getBookingDetails(bookingId, userId);
  return row ? mapBookingDetailsToSummary(row) : null;
}

export async function confirmCashOnArrivalBooking(bookingId: number, userId: string): Promise<{ bookingId: number }> {
  await expirePendingBookingHoldIfNeeded(bookingId, userId);

  const row = await getBookingDetails(bookingId, userId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  assertPayablePendingHold(row);
  await assertHotelSupportsMethod(row.hotelId, "cash_on_arrival");

  const updated = await db
    .update(bookings)
    .set({
      status: "confirmed",
      paymentMethod: "cash_on_arrival",
      paymentStatus: "pending",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return { bookingId };
}

export async function createStripeCheckoutForBooking(
  bookingId: number,
  userId: string,
  appUrl: string,
  returnTo?: string
): Promise<{ bookingId: number; url: string; expiresAt: string }> {
  await expirePendingBookingHoldIfNeeded(bookingId, userId);

  const row = await getBookingDetails(bookingId, userId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  assertPayablePendingHold(row);
  await assertHotelSupportsMethod(row.hotelId, "stripe");

  const expiresAt = addMinutes(new Date(), STRIPE_HOLD_MINUTES);
  const stripe = getStripe();
  const totalPrice = getTotalPrice(row);
  const appBaseUrl = normalizeAppUrl(appUrl);
  const returnEndpoint = `${appBaseUrl}/api/stripe/return`;
  const hasReturnTo = typeof returnTo === "string" && returnTo.trim().length > 0;
  const encodedReturnTo = hasReturnTo ? encodeURIComponent(returnTo.trim()) : null;
  const successUrl = hasReturnTo && encodedReturnTo
    ? `${returnEndpoint}?bookingId=${bookingId}&stripe=success&returnTo=${encodedReturnTo}&session_id={CHECKOUT_SESSION_ID}`
    : `${appBaseUrl}/bookings/${bookingId}/confirmation?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = hasReturnTo && encodedReturnTo
    ? `${returnEndpoint}?bookingId=${bookingId}&stripe=cancelled&returnTo=${encodedReturnTo}`
    : `${appBaseUrl}/listings/${row.hotelId}/summary?bookingId=${bookingId}&stripe=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: CHECKOUT_CURRENCY,
          product_data: { name: `${row.hotelName} - ${row.roomType}` },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.ceil(expiresAt.getTime() / 1000),
    metadata: {
      bookingId: String(bookingId),
      userId,
      hotelId: String(row.hotelId),
      roomTypeId: String(row.roomTypeId),
    },
  });

  if (!session.url) {
    throw new Error("STRIPE_SESSION_URL_MISSING");
  }

  const updated = await db
    .update(bookings)
    .set({
      paymentMethod: "stripe",
      paymentStatus: "pending",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: getStripePaymentIntentId(session.payment_intent),
      stripeRefundId: null,
      expiresAt,
    })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return { bookingId, url: session.url, expiresAt: expiresAt.toISOString() };
}

export async function handleStripeCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<{ bookingId: number }> {
  const bookingId = Number(session.metadata?.bookingId);
  const stripePaymentIntentId = getStripePaymentIntentId(session.payment_intent);

  if (!Number.isInteger(bookingId) || bookingId < 1) {
    throw new Error("INVALID_BOOKING_METADATA");
  }

  if (!stripePaymentIntentId) {
    throw new Error("STRIPE_PAYMENT_INTENT_MISSING");
  }

  const row = await getBookingDetails(bookingId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (!isPendingHoldStatus(row.status)) {
    if (row.status === "confirmed" && row.paymentMethod === "stripe" && row.paymentStatus === "paid") {
      await db
        .update(bookings)
        .set({
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId,
        })
        .where(eq(bookings.id, bookingId));

      return { bookingId };
    }

    if (row.status === "expired" || row.status === "cancelled") {
      return { bookingId };
    }

    throw new Error("BOOKING_NOT_PENDING");
  }

  const updated = await db
    .update(bookings)
    .set({
      status: "confirmed",
      paymentMethod: "stripe",
      paymentStatus: "paid",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return { bookingId };
}

export async function confirmStripeCheckoutSessionForBooking(
  bookingId: number,
  sessionId: string,
  userId: string
): Promise<{ bookingId: number }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (!session || session.object !== "checkout.session") {
    throw new Error("STRIPE_SESSION_NOT_FOUND");
  }

  const metadataBookingId = Number(session.metadata?.bookingId);
  if (!Number.isInteger(metadataBookingId) || metadataBookingId !== bookingId) {
    throw new Error("BOOKING_MISMATCH");
  }

  if (session.metadata?.userId !== userId) {
    throw new Error("FORBIDDEN_BOOKING_ACCESS");
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("PAYMENT_NOT_COMPLETED");
  }

  return handleStripeCheckoutCompleted(session);
}

export async function cancelPendingBookingHold(
  bookingId: number,
  userId: string
): Promise<"cancelled" | "not_found" | "not_pending"> {
  await expirePendingBookingHoldIfNeeded(bookingId, userId);

  const row = await getBookingDetails(bookingId, userId);

  if (!row) {
    return "not_found";
  }

  const bookingStatus = normalizeBookingStatus(row);
  if (bookingStatus !== "pending_payment") {
    return "not_pending";
  }

  const updated = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentMethod: null,
      paymentStatus: "cancelled",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning({ id: bookings.id });

  return updated.length > 0 ? "cancelled" : "not_found";
}

function buildCancelResult(
  row: BookingDetailsRow,
  paymentMethod: BookingPaymentMethod | null,
  paymentStatus: BookingPaymentStatus,
  notification: CancelBookingResult["notification"],
  stripeRefundId?: string | null
): CancelBookingResult {
  return {
    bookingId: row.bookingId,
    status: "cancelled",
    paymentMethod,
    paymentStatus,
    stripeRefundId,
    notification,
  };
}

async function cancelPendingHold(row: BookingDetailsRow): Promise<CancelBookingResult> {
  const updated = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentMethod: null,
      paymentStatus: "cancelled",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.userId, row.userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return buildCancelResult(row, null, "cancelled", {
    title: "Booking cancelled",
    message: "Reservation hold cancelled.",
  });
}

async function cancelCashOnArrivalBooking(row: BookingDetailsRow): Promise<CancelBookingResult> {
  const updated = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "cancelled",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.userId, row.userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return buildCancelResult(row, "cash_on_arrival", "cancelled", {
    title: "Booking cancelled",
    message: "No payment was collected.",
  });
}

function getExistingCancellationResult(row: BookingDetailsRow): CancelBookingResult | null {
  if (row.paymentStatus === "cancelled") {
    const method = isSupportedMethod(row.paymentMethod ?? "")
      ? row.paymentMethod as BookingPaymentMethod
      : null;

    return buildCancelResult(row, method, "cancelled", {
      title: "Booking cancelled",
      message: method === "cash_on_arrival" ? "No payment was collected." : "Reservation hold cancelled.",
    });
  }

  if (row.paymentMethod !== "stripe") {
    return null;
  }

  if (!row.stripeRefundId && !isStripeRefundStatus(row.paymentStatus)) {
    return null;
  }

  const paymentStatus = isStripeRefundStatus(row.paymentStatus)
    ? row.paymentStatus
    : "refund_pending";

  return buildCancelResult(
    row,
    "stripe",
    paymentStatus,
    {
      title: "Booking cancelled",
      message: paymentStatus === "refunded"
        ? "Your refund has been issued."
        : paymentStatus === "refund_denied"
          ? "Refund is not available for this booking."
          : "Your refund is being processed.",
    },
    row.stripeRefundId
  );
}

async function resolveExistingCancellation(row: BookingDetailsRow): Promise<CancelBookingResult | null> {
  const result = getExistingCancellationResult(row);
  if (!result) {
    return null;
  }

  if (row.status === "cancelled" && row.paymentStatus === result.paymentStatus) {
    return result;
  }

  const update = {
    status: "cancelled",
    paymentStatus: result.paymentStatus,
    expiresAt: null,
    stripeRefundId: result.stripeRefundId ?? row.stripeRefundId,
  };

  const updated = await db
    .update(bookings)
    .set(update)
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.userId, row.userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return result;
}

async function createStripeRefundForBooking(row: BookingDetailsRow): Promise<Stripe.Refund> {
  if (!row.stripePaymentIntentId) {
    throw new Error("BOOKING_REFUND_PAYMENT_INTENT_MISSING");
  }

  try {
    return await getStripe().refunds.create(
      { payment_intent: row.stripePaymentIntentId },
      { idempotencyKey: `booking-${row.bookingId}-refund` }
    );
  } catch (error) {
    console.error("Stripe refund creation failed:", error);
    throw new Error("STRIPE_REFUND_FAILED");
  }
}

async function cancelStripePaidBooking(row: BookingDetailsRow): Promise<CancelBookingResult> {
  const existingResult = await resolveExistingCancellation(row);
  if (existingResult) {
    return existingResult;
  }

  if (!canRefundBooking(row)) {
    throw new Error("BOOKING_ALREADY_STARTED");
  }

  const refund = await createStripeRefundForBooking(row);
  if (refund.status === "failed" || refund.status === "canceled") {
    await markStripeRefundDenied(row, refund.id);
    return buildCancelResult(
      row,
      "stripe",
      "refund_denied",
      {
        title: "Booking cancelled",
        message: "Refund is not available for this booking.",
      },
      refund.id
    );
  }

  const refundStatus = getRefundStatus(refund);
  await markStripeRefundPending(row, refund.id);

  if (refundStatus === "refunded") {
    await markStripeRefunded(row.bookingId, refund.id);
  }

  return buildCancelResult(
    row,
    "stripe",
    refundStatus,
    {
      title: "Booking cancelled",
      message: refundStatus === "refunded"
        ? "Your refund has been issued."
        : "Your refund is being processed.",
    },
    refund.id
  );
}

async function markStripeRefundPending(row: BookingDetailsRow, refundId: string): Promise<void> {
  const updated = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "refund_pending",
      stripeRefundId: refundId,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.userId, row.userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }
}

async function markStripeRefunded(bookingId: number, refundId: string): Promise<void> {
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "refunded",
      stripeRefundId: refundId,
      expiresAt: null,
    })
    .where(eq(bookings.id, bookingId));
}

async function markStripeRefundDenied(row: BookingDetailsRow, refundId: string): Promise<void> {
  const updated = await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "refund_denied",
      stripeRefundId: refundId,
      expiresAt: null,
    })
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.userId, row.userId)))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }
}

export async function cancelBooking(bookingId: number, userId: string): Promise<CancelBookingResult> {
  await expirePendingBookingHoldIfNeeded(bookingId, userId);

  const row = await getBookingDetails(bookingId, userId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return cancelBookingRow(row);
}

async function cancelBookingRow(row: BookingDetailsRow): Promise<CancelBookingResult> {
  const existingResult = await resolveExistingCancellation(row);
  if (existingResult) {
    return existingResult;
  }

  const bookingStatus = normalizeBookingStatus(row);
  if (bookingStatus === "pending_payment") {
    return cancelPendingHold(row);
  }

  if (bookingStatus !== "confirmed") {
    throw new Error("BOOKING_NOT_CANCELLABLE");
  }

  if (!canRefundBooking(row)) {
    throw new Error("BOOKING_ALREADY_STARTED");
  }

  if (row.paymentMethod === "cash_on_arrival" && row.paymentStatus === "pending") {
    return cancelCashOnArrivalBooking(row);
  }

  if (row.paymentMethod === "stripe" && row.paymentStatus === "paid") {
    return cancelStripePaidBooking(row);
  }

  throw new Error("BOOKING_NOT_CANCELLABLE");
}

export async function cancelPartnerBooking(bookingId: number, userId: string): Promise<CancelBookingResult> {
  const partnerId = await getPartnerIdForUser(userId);
  const row = await getPartnerBookingDetailsForCancellation(bookingId, partnerId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  await expirePendingBookingHoldIfNeeded(bookingId, row.userId);

  const refreshedRow = await getPartnerBookingDetailsForCancellation(bookingId, partnerId);
  if (!refreshedRow) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return cancelBookingRow(refreshedRow);
}

export async function cancelAdminBooking(bookingId: number): Promise<CancelBookingResult> {
  await expirePendingBookingHoldIfNeeded(bookingId);

  const row = await getBookingDetails(bookingId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return cancelBookingRow(row);
}

function getRefundMatchCondition(refund: Stripe.Refund) {
  const paymentIntentId = getRefundPaymentIntentId(refund);
  return paymentIntentId
    ? or(eq(bookings.stripeRefundId, refund.id), eq(bookings.stripePaymentIntentId, paymentIntentId))
    : eq(bookings.stripeRefundId, refund.id);
}

export async function handleStripeRefundSucceeded(refund: Stripe.Refund): Promise<void> {
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "refunded",
      stripeRefundId: refund.id,
      expiresAt: null,
    })
    .where(
      and(
        eq(bookings.status, "cancelled"),
        eq(bookings.paymentMethod, "stripe"),
        inArray(bookings.paymentStatus, ["refund_pending", "refunded"]),
        getRefundMatchCondition(refund)
      )
    );
}

export async function handleStripeRefundFailed(refund: Stripe.Refund): Promise<void> {
  await db
    .update(bookings)
    .set({
      status: "cancelled",
      paymentStatus: "refund_denied",
      stripeRefundId: refund.id,
      expiresAt: null,
    })
    .where(
      and(
        eq(bookings.status, "cancelled"),
        eq(bookings.paymentMethod, "stripe"),
        eq(bookings.paymentStatus, "refund_pending"),
        getRefundMatchCondition(refund)
      )
    );
}

export async function handleStripeChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = getChargePaymentIntentId(charge);
  if (!paymentIntentId) {
    return;
  }

  const refundId = charge.refunds?.data.find((refund) => refund.status === "succeeded")?.id
    ?? charge.refunds?.data[0]?.id
    ?? null;
  const update = refundId
    ? { status: "cancelled", paymentStatus: "refunded", stripeRefundId: refundId, expiresAt: null }
    : { status: "cancelled", paymentStatus: "refunded", expiresAt: null };

  await db
    .update(bookings)
    .set(update)
    .where(
      and(
        eq(bookings.status, "cancelled"),
        eq(bookings.paymentMethod, "stripe"),
        eq(bookings.stripePaymentIntentId, paymentIntentId),
        inArray(bookings.paymentStatus, ["refund_pending", "refunded"])
      )
    );
}

export async function getBookingConfirmation(
  bookingId: number,
  userId: string
): Promise<BookingConfirmation | null> {
  const summary = await getBookingSummary(bookingId, userId);
  return summary;
}

export function getCancelledBookingBadge(
  paymentMethod: BookingPaymentMethod | null,
  paymentStatus: BookingPaymentStatus
): CancelledBookingBadge | undefined {
  if (paymentMethod === "cash_on_arrival" && paymentStatus === "cancelled") {
    return "Cancelled";
  }

  if (paymentMethod !== "stripe") {
    return undefined;
  }

  if (paymentStatus === "refunded") return "Cancelled · Refunded";
  if (paymentStatus === "refund_denied") return "Cancelled · Without refund";
  if (paymentStatus === "refund_pending") return "Cancelled · Refund pending";
  return undefined;
}

function getBookingSortPriority(booking: MyBooking): number {
  if (booking.status === "cancelled") return 2;
  if (booking.status === "past") return 1;
  return 0;
}

function sortMyBookings(a: MyBooking, b: MyBooking): number {
  const priorityDifference = getBookingSortPriority(a) - getBookingSortPriority(b);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
}

export async function getBookings(userId: string): Promise<MyBooking[]> {
  await normalizeExpiredPendingBookings();

  const rows = await db
    .select({
      id: bookings.id,
      hotelId: hotels.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      guestsCount: bookings.guestsCount,
      roomsCount: bookings.roomsCount,
      status: bookings.status,
      paymentMethod: bookings.paymentMethod,
      paymentStatus: bookings.paymentStatus,
      roomTypeName: roomTypes.name,
      roomPrice: roomTypes.pricePerNight,
      hotelName: hotels.name,
      hotelAddress: hotels.location,
      hotelImageUrl: hotelImages.imageKey,
      reviewId: reviews.id,
    })
    .from(bookings)
    .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .leftJoin(hotelImages, and(eq(hotelImages.hotelId, hotels.id), isNull(hotelImages.roomTypeId)))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.userId, userId),
        or(
          and(
            inArray(bookings.status, ["confirmed", "completed"]),
            or(
              and(eq(bookings.paymentMethod, "stripe"), eq(bookings.paymentStatus, "paid")),
              and(eq(bookings.paymentMethod, "cash_on_arrival"), eq(bookings.paymentStatus, "pending"))
            )
          ),
          and(
            eq(bookings.status, "cancelled"),
            or(
              and(eq(bookings.paymentMethod, "cash_on_arrival"), eq(bookings.paymentStatus, "cancelled")),
              and(eq(bookings.paymentMethod, "stripe"), inArray(bookings.paymentStatus, [...STRIPE_CANCELLED_PAYMENT_STATUSES]))
            )
          )
        )
      )
    )
    .orderBy(bookings.checkInDate);

  const uniqueBookings = new Map<number, BookingRow>();

  for (const row of rows) {
    if (!uniqueBookings.has(row.id)) {
      uniqueBookings.set(row.id, row as BookingRow);
    }
  }

  return mapBookingRowsToMyBookings(Array.from(uniqueBookings.values())).sort(sortMyBookings);
}

function mapBookingRowsToMyBookings(rows: BookingRow[]): MyBooking[] {
  return rows.map((row) => {
    const checkIn = parseDateOnly(String(row.checkInDate));
    const checkOut = parseDateOnly(String(row.checkOutDate));
    const paymentMethod = isSupportedMethod(row.paymentMethod ?? "") ? row.paymentMethod as BookingPaymentMethod : null;
    const paymentStatus = isBookingPaymentStatus(row.paymentStatus) ? row.paymentStatus : "pending";
    const isCancelled = row.status === "cancelled";
    const isCompleted = row.status === "completed";
    const status: BookingDisplayStatus = isCancelled
      ? "cancelled"
      : isCompleted
        ? "past"
        : computeStayStatus(checkIn, checkOut);
    const lifecycleStatus: BookingStatus = isCancelled
      ? "cancelled"
      : isCompleted
        ? "completed"
        : "confirmed";
    const nights = getNightCount(String(row.checkInDate), String(row.checkOutDate));
    const totalPrice = (row.roomPrice ?? 0) * Math.max(1, nights) * getRoomsCount(row.roomsCount);
    const hasReview = row.reviewId !== null;

    return {
      id: String(row.id),
      hotelId: row.hotelId ?? undefined,
      hotelName: row.hotelName ?? "Unknown hotel",
      hotelAddress: row.hotelAddress ?? "",
      hotelImage: row.hotelImageUrl ? resolveImageUrl(row.hotelImageUrl) : undefined,
      roomType: row.roomTypeName ?? "Room",
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      guestsCount: row.guestsCount ?? 1,
      roomsCount: getRoomsCount(row.roomsCount),
      totalPrice,
      status,
      lifecycleStatus,
      paymentMethod,
      paymentStatus,
      cancelledBadge: isCancelled ? getCancelledBookingBadge(paymentMethod, paymentStatus) : undefined,
      canCancel: lifecycleStatus === "confirmed" && (
        (paymentMethod === "cash_on_arrival" && paymentStatus === "pending") ||
        (paymentMethod === "stripe" && paymentStatus === "paid")
      ),
      canReview: status === "past" && !hasReview,
      hasReview,
      reviewId: row.reviewId ?? undefined,
      daysRemaining: status === "active" ? computeDaysRemaining(checkOut) : undefined,
    };
  });
}

function normalizeClientBookingsPageInput(input: ClientBookingsPageInput) {
  const page = Number.isInteger(input.page) && (input.page as number) > 0 ? (input.page as number) : 1;
  const pageSize = Number.isInteger(input.pageSize) && (input.pageSize as number) > 0
    ? Math.min(input.pageSize as number, 24)
    : 3;

  return { page, pageSize };
}

function clientVisibleBookingsCondition() {
  return or(
    and(
      inArray(bookings.status, ["confirmed", "completed"]),
      or(
        and(eq(bookings.paymentMethod, "stripe"), eq(bookings.paymentStatus, "paid")),
        and(eq(bookings.paymentMethod, "cash_on_arrival"), eq(bookings.paymentStatus, "pending"))
      )
    ),
    and(
      eq(bookings.status, "cancelled"),
      or(
        and(eq(bookings.paymentMethod, "cash_on_arrival"), eq(bookings.paymentStatus, "cancelled")),
        and(eq(bookings.paymentMethod, "stripe"), inArray(bookings.paymentStatus, [...STRIPE_CANCELLED_PAYMENT_STATUSES]))
      )
    )
  );
}

export async function getClientBookingsPage(
  userId: string,
  input: ClientBookingsPageInput = {}
): Promise<ClientBookingsPage> {
  await normalizeExpiredPendingBookings();

  const { page, pageSize } = normalizeClientBookingsPageInput(input);
  const today = formatDate(new Date());
  const baseCondition = and(eq(bookings.userId, userId), clientVisibleBookingsCondition());

  const [activeRows, countRow] = await Promise.all([
    db
      .select({
        id: bookings.id,
        hotelId: hotels.id,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        guestsCount: bookings.guestsCount,
        roomsCount: bookings.roomsCount,
        status: bookings.status,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        roomTypeName: roomTypes.name,
        roomPrice: roomTypes.pricePerNight,
        hotelName: hotels.name,
        hotelAddress: hotels.location,
        hotelImageUrl: hotelImages.imageKey,
        reviewId: reviews.id,
      })
      .from(bookings)
      .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
      .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
      .leftJoin(hotelImages, and(eq(hotelImages.hotelId, hotels.id), isNull(hotelImages.roomTypeId)))
      .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
      .where(
        and(
          baseCondition,
          eq(bookings.status, "confirmed"),
          lte(bookings.checkInDate, today),
          gt(bookings.checkOutDate, today)
        )
      )
      .orderBy(desc(bookings.checkInDate), desc(bookings.id)),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        and(
          baseCondition,
          or(
            ne(bookings.status, "confirmed"),
            gt(bookings.checkInDate, today),
            lte(bookings.checkOutDate, today)
          )
        )
      )
      .then((rows) => rows[0]),
  ]);

  const activeUnique = new Map<number, BookingRow>();
  for (const row of activeRows) {
    if (!activeUnique.has(row.id)) activeUnique.set(row.id, row as BookingRow);
  }

  const activeBooking = mapBookingRowsToMyBookings(Array.from(activeUnique.values()))
    .find((booking) => booking.status === "active") ?? null;

  const totalItems = Number(countRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const inactiveIds = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        baseCondition,
        or(
          ne(bookings.status, "confirmed"),
          gt(bookings.checkInDate, today),
          lte(bookings.checkOutDate, today)
        )
      )
    )
    .orderBy(bookings.checkInDate)
    .limit(pageSize)
    .offset(offset);

  const ids = inactiveIds.map((row) => row.id);
  const inactiveRows = ids.length === 0
    ? []
    : await db
      .select({
        id: bookings.id,
        hotelId: hotels.id,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        guestsCount: bookings.guestsCount,
        roomsCount: bookings.roomsCount,
        status: bookings.status,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        roomTypeName: roomTypes.name,
        roomPrice: roomTypes.pricePerNight,
        hotelName: hotels.name,
        hotelAddress: hotels.location,
        hotelImageUrl: hotelImages.imageKey,
        reviewId: reviews.id,
      })
      .from(bookings)
      .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
      .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
      .leftJoin(hotelImages, and(eq(hotelImages.hotelId, hotels.id), isNull(hotelImages.roomTypeId)))
      .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
      .where(inArray(bookings.id, ids));

  const uniqueInactive = new Map<number, BookingRow>();
  for (const row of inactiveRows) {
    if (!uniqueInactive.has(row.id)) uniqueInactive.set(row.id, row as BookingRow);
  }
  const orderedInactiveRows = ids
    .map((id) => uniqueInactive.get(id))
    .filter((row): row is BookingRow => Boolean(row));
  const inactiveBookings = mapBookingRowsToMyBookings(orderedInactiveRows).sort(sortMyBookings);

  return {
    activeBooking,
    inactiveBookings,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
