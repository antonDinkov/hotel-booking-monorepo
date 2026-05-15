import { and, eq, gt, lt, ne, or } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "../../db";
import { bookings, hotelImages, hotelPaymentMethods, hotels, roomTypes } from "../../db/schema";
import { getStripe } from "@/server/lib/stripe";
import type {
  BookingConfirmation,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  BookingSummary,
  CreateBookingHoldRequest,
  CreateBookingHoldResponse,
  MyBooking,
  BookingDisplayStatus,
} from "@/types/booking";

const HOLD_MINUTES = 15;
const CHECKOUT_CURRENCY = "usd";
const SUPPORTED_PAYMENT_METHODS = ["stripe", "cash_on_arrival"] as const;
const PENDING_HOLD_STATUSES = ["pending_payment", "pending"] as const;
const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed", "cancelled"] as const;

type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

interface BookingRow {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  roomsCount: number | null;
  roomTypeName: string | null;
  roomPrice: number | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelImageUrl: string | null;
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

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateOnly(value: string): boolean {
  const parsed = parseDateOnly(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

function getNightCount(checkInDate: string, checkOutDate: string): number {
  const checkIn = parseDateOnly(checkInDate);
  const checkOut = parseDateOnly(checkOutDate);
  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay));
}

function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function normalizeBookingStatus(row: BookingDetailsRow, now = new Date()): BookingStatus {
  if (row.status === "confirmed" || row.status === "cancelled" || row.status === "expired") {
    return row.status;
  }

  const expiresAt = coerceDate(row.expiresAt);
  if (isPendingHoldStatus(row.status) && expiresAt && expiresAt > now) {
    return "pending_payment";
  }

  return "expired";
}

function normalizeBookingPaymentStatus(row: BookingDetailsRow, bookingStatus: BookingStatus): BookingPaymentStatus {
  if (bookingStatus === "cancelled") {
    return "cancelled";
  }

  if (bookingStatus === "confirmed") {
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
  return value && value > 0 ? value : 1;
}

function getTotalPrice(row: BookingDetailsRow): number {
  const nights = Math.max(1, getNightCount(row.checkInDate, row.checkOutDate));
  return row.pricePerNight * nights * getRoomsCount(row.roomsCount);
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

async function getBookingDetails(bookingId: number, userId?: string): Promise<BookingDetailsRow | null> {
  const conditions = userId
    ? and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
    : eq(bookings.id, bookingId);

  const row = await db
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
      expiresAt: bookings.expiresAt,
      pricePerNight: roomTypes.pricePerNight,
    })
    .from(bookings)
    .innerJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .innerJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .where(conditions)
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
  const row = await getBookingDetails(bookingId, userId);
  return row ? mapBookingDetailsToSummary(row) : null;
}

export async function confirmCashOnArrivalBooking(bookingId: number, userId: string): Promise<{ bookingId: number }> {
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
  appUrl: string
): Promise<{ bookingId: number; url: string; expiresAt: string }> {
  const row = await getBookingDetails(bookingId, userId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  assertPayablePendingHold(row);
  await assertHotelSupportsMethod(row.hotelId, "stripe");

  const expiresAt = coerceDate(row.expiresAt) ?? addMinutes(new Date(), HOLD_MINUTES);
  await db
    .update(bookings)
    .set({ paymentMethod: "stripe", paymentStatus: "pending" })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning({ id: bookings.id });

  const stripe = getStripe();
  const totalPrice = getTotalPrice(row);
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
    success_url: `${normalizeAppUrl(appUrl)}/bookings/${bookingId}/confirmation?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${normalizeAppUrl(appUrl)}/listings/${row.hotelId}/summary?bookingId=${bookingId}&stripe=cancelled`,
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

  return { bookingId, url: session.url, expiresAt: expiresAt.toISOString() };
}

export async function handleStripeCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<{ bookingId: number }> {
  const bookingId = Number(session.metadata?.bookingId);

  if (!Number.isInteger(bookingId) || bookingId < 1) {
    throw new Error("INVALID_BOOKING_METADATA");
  }

  const row = await getBookingDetails(bookingId);
  if (!row) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const bookingStatus = normalizeBookingStatus(row);
  if (bookingStatus !== "pending_payment") {
    if (bookingStatus === "confirmed" && row.paymentMethod === "stripe" && row.paymentStatus === "paid") {
      return { bookingId };
    }

    throw new Error("BOOKING_EXPIRED");
  }

  const updated = await db
    .update(bookings)
    .set({
      status: "confirmed",
      paymentMethod: "stripe",
      paymentStatus: "paid",
      expiresAt: null,
    })
    .where(eq(bookings.id, bookingId))
    .returning({ id: bookings.id });

  if (!updated.length) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  return { bookingId };
}

export async function cancelBooking(bookingId: number, userId: string): Promise<boolean> {
  const row = await getBookingDetails(bookingId, userId);

  if (!row) {
    return false;
  }

  const bookingStatus = normalizeBookingStatus(row);
  if (bookingStatus === "expired" || bookingStatus === "cancelled") {
    return false;
  }

  const updated = await db
    .update(bookings)
    .set({ status: "cancelled", paymentStatus: "cancelled", expiresAt: null })
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
    .returning({ id: bookings.id });

  return updated.length > 0;
}

export async function getBookingConfirmation(
  bookingId: number,
  userId: string
): Promise<BookingConfirmation | null> {
  const summary = await getBookingSummary(bookingId, userId);
  return summary;
}

export async function getBookings(userId: string): Promise<MyBooking[]> {
  const rows = await db
    .select({
      id: bookings.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomsCount: bookings.roomsCount,
      roomTypeName: roomTypes.name,
      roomPrice: roomTypes.pricePerNight,
      hotelName: hotels.name,
      hotelAddress: hotels.location,
      hotelImageUrl: hotelImages.imageKey,
    })
    .from(bookings)
    .leftJoin(roomTypes, eq(roomTypes.id, bookings.roomTypeId))
    .leftJoin(hotels, eq(hotels.id, roomTypes.hotelId))
    .leftJoin(hotelImages, eq(hotelImages.hotelId, hotels.id))
    .where(eq(bookings.userId, userId))
    .orderBy(bookings.checkInDate);

  const uniqueBookings = new Map<number, BookingRow>();

  for (const row of rows) {
    if (!uniqueBookings.has(row.id)) {
      uniqueBookings.set(row.id, row as BookingRow);
    }
  }

  return Array.from(uniqueBookings.values()).map((row) => {
    const checkIn = parseDateOnly(String(row.checkInDate));
    const checkOut = parseDateOnly(String(row.checkOutDate));
    const status = computeStayStatus(checkIn, checkOut);
    const nights = getNightCount(String(row.checkInDate), String(row.checkOutDate));
    const totalPrice = (row.roomPrice ?? 0) * Math.max(1, nights) * getRoomsCount(row.roomsCount);

    return {
      id: String(row.id),
      hotelName: row.hotelName ?? "Unknown hotel",
      hotelAddress: row.hotelAddress ?? "",
      hotelImage: row.hotelImageUrl ?? undefined,
      roomType: row.roomTypeName ?? "Room",
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      totalPrice,
      status,
      daysRemaining: status === "active" ? computeDaysRemaining(checkOut) : undefined,
    };
  }).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
}
