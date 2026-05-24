import "dotenv/config";

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { asc, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  bookings,
  hotelPaymentMethods,
  hotels,
  partners,
  reviews,
  roles,
  roomTypes,
  userProfiles,
  userRoles,
  users,
} from "./schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const db = drizzle({ client: neon(process.env.DATABASE_URL) });

const CLIENT_EMAIL_PREFIX = "seed-large-client-";
const PARTNER_EMAIL_PREFIX = "seed-large-partner-";
const DEMO_HOTEL_PREFIX = "Seed Large Demo Hotel ";
const EMAIL_DOMAIN = "example.com";
const RAW_PASSWORD = "123456";
const BATCH_SIZE = 1000;

const TARGET_USERS = 4500;
const TARGET_BOOKINGS = 15000;
const TARGET_REVIEWS = 10050;
const MAX_CANCELLED_OR_FAILED = 1000;

const BOOKING_DISTRIBUTION = {
  pastSuccessful: 10200,
  currentActive: 700,
  futureUpcoming: 3000,
  pendingHolds: 200,
  cancelledOrFailed: 900,
} as const;

const REVIEW_COMMENT_POOL = [
  "Smooth check-in and very clean room. The stay matched the listing.",
  "Great location for a short trip and the staff handled requests quickly.",
  "Comfortable bed, quiet room, and good value for the price.",
  "Breakfast was decent and housekeeping stayed consistent each day.",
  "Reliable Wi-Fi and practical room layout for work and rest.",
  "Family stay was easy and the room had enough space for everyone.",
  "The hotel felt safe and the front desk was helpful at all hours.",
  "Easy transport access and the booking process was straightforward.",
  "Good amenities and a calm environment during the whole stay.",
  "Overall a solid experience and I would consider booking again.",
] as const;

const REVIEW_REPLY_POOL = [
  "Thank you for your feedback. We are glad your stay went well.",
  "We appreciate your review and hope to welcome you again soon.",
  "Thanks for staying with us. Your comments were shared with the team.",
  "Thank you. We are happy to hear the room and service met your expectations.",
  "We value your feedback and look forward to your next visit.",
] as const;

const FIRST_NAMES = ["Liam", "Noah", "Oliver", "James", "Elijah", "Ava", "Emma", "Olivia", "Sophia", "Mia"] as const;
const LAST_NAMES = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Martinez", "Anderson", "Taylor"] as const;
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Seattle", "Denver", "Miami"] as const;
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "France"] as const;

type Rng = () => number;
type RoomTypeRecord = { id: number; hotelId: number; capacity: number; totalRooms: number };

type BookingSeedRow = {
  roomTypeId: number;
  userId: string;
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomsCount: number;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  reviewEligible: boolean;
};

type ReviewableBookingRef = { bookingId: number; userId: string; hotelId: number; checkOutDate: string };

function createRng(seed = 20260518): Rng {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function makeClientEmail(index: number): string {
  return `${CLIENT_EMAIL_PREFIX}${String(index).padStart(5, "0")}@${EMAIL_DOMAIN}`;
}

function makePartnerEmail(index: number): string {
  return `${PARTNER_EMAIL_PREFIX}${String(index).padStart(3, "0")}@${EMAIL_DOMAIN}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function shuffleInPlace<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function ensureRoles() {
  const required = ["client", "partner", "admin"] as const;
  const existing = await db.select({ id: roles.id, name: roles.name }).from(roles).where(inArray(roles.name, [...required]));
  const byName = new Map(existing.map((r) => [r.name, r.id]));
  const missing = required.filter((name) => !byName.has(name));

  if (missing.length) {
    const inserted = await db.insert(roles).values(missing.map((name) => ({ name }))).returning({ id: roles.id, name: roles.name });
    for (const row of inserted) byName.set(row.name, row.id);
  }

  return {
    client: byName.get("client")!,
    partner: byName.get("partner")!,
    admin: byName.get("admin")!,
  };
}

async function cleanupOnlyThisSeedData(): Promise<void> {
  const seedUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(or(like(users.email, `${CLIENT_EMAIL_PREFIX}%`), like(users.email, `${PARTNER_EMAIL_PREFIX}%`)));

  if (!seedUsers.length) return;

  const seedUserIds = seedUsers.map((u) => u.id);

  const seedBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(inArray(bookings.userId, seedUserIds));

  const seedBookingIds = seedBookings.map((b) => b.id);

  if (seedBookingIds.length) {
    await db.delete(reviews).where(inArray(reviews.bookingId, seedBookingIds));
    await db.delete(bookings).where(inArray(bookings.id, seedBookingIds));
  }

  await db.delete(userProfiles).where(inArray(userProfiles.userId, seedUserIds));
  await db.delete(userRoles).where(inArray(userRoles.userId, seedUserIds));

  const seedPartners = await db.select({ id: partners.id }).from(partners).where(inArray(partners.userId, seedUserIds));
  if (seedPartners.length) {
    // Optional scoped cleanup for fallback assets created by this exact script.
    const fallbackHotels = await db
      .select({ id: hotels.id })
      .from(hotels)
      .where(or(inArray(hotels.partnerId, seedPartners.map((p) => p.id)), like(hotels.name, `${DEMO_HOTEL_PREFIX}%`)));

    if (fallbackHotels.length) {
      const fallbackHotelIds = fallbackHotels.map((h) => h.id);
      const fallbackRoomTypes = await db
        .select({ id: roomTypes.id })
        .from(roomTypes)
        .where(inArray(roomTypes.hotelId, fallbackHotelIds));

      if (fallbackRoomTypes.length) {
        await db.delete(roomTypes).where(inArray(roomTypes.id, fallbackRoomTypes.map((r) => r.id)));
      }

      await db.delete(hotelPaymentMethods).where(inArray(hotelPaymentMethods.hotelId, fallbackHotelIds));
      await db.delete(hotels).where(inArray(hotels.id, fallbackHotelIds));
    }

    await db.delete(partners).where(inArray(partners.id, seedPartners.map((p) => p.id)));
  }

  await db.delete(users).where(inArray(users.id, seedUserIds));
}

async function ensureHotelRoomInventory(roleIds: { partner: number }, passwordHash: string) {
  let hotelRows = await db.select({ id: hotels.id, name: hotels.name, partnerId: hotels.partnerId }).from(hotels).orderBy(asc(hotels.id));
  let roomTypeRows = await db
    .select({ id: roomTypes.id, hotelId: roomTypes.hotelId, capacity: roomTypes.capacity, totalRooms: roomTypes.totalRooms })
    .from(roomTypes)
    .orderBy(asc(roomTypes.id));

  if (hotelRows.length && roomTypeRows.length) {
    return { hotelRows, roomTypeRows };
  }

  const partnerUsers = await db
    .insert(users)
    .values(Array.from({ length: 6 }, (_, i) => ({ email: makePartnerEmail(i + 1), passwordHash, isActive: true })))
    .returning({ id: users.id, email: users.email });

  await db.insert(userRoles).values(partnerUsers.map((u) => ({ userId: u.id, roleId: roleIds.partner })));
  await db.insert(userProfiles).values(
    partnerUsers.map((u, i) => ({ userId: u.id, fullName: `Seed Large Partner ${i + 1}`, city: pick(createRng(800 + i), CITIES), country: "United States" }))
  );

  const partnerRows = await db
    .insert(partners)
    .values(
      partnerUsers.map((u, i) => ({
        userId: u.id,
        companyName: `Seed Large Hospitality ${i + 1}`,
        representativeFirstName: "Seed",
        representativeLastName: `Large${i + 1}`,
        position: "Operations Manager",
        email: u.email,
        phone: `+1-555-830-${String(100 + i)}`,
        website: `https://seed-large-partner-${i + 1}.example.com`,
        companyAddress: `${100 + i} Seed Street`,
        vatNumber: `SEED-LARGE-VAT-${i + 1}`,
        isVerified: true,
        verificationStatus: "verified",
      }))
    )
    .returning({ id: partners.id });

  const createdHotels = await db
    .insert(hotels)
    .values(
      Array.from({ length: 24 }, (_, i) => ({
        name: `${DEMO_HOTEL_PREFIX}${String(i + 1).padStart(4, "0")}`,
        location: `${pick(createRng(200 + i), CITIES)}, ${pick(createRng(300 + i), COUNTRIES)}`,
        description: "Seed large demo hotel for load and pagination validation.",
        partnerId: partnerRows[i % partnerRows.length].id,
        isFeatured: i % 6 === 0,
        registeredAt: addDays(new Date(), -randInt(createRng(400 + i), 20, 540)),
      }))
    )
    .returning({ id: hotels.id });

  await db.insert(hotelPaymentMethods).values(
    createdHotels.flatMap((h) => [{ hotelId: h.id, method: "stripe" }, { hotelId: h.id, method: "cash_on_arrival" }])
  );

  await db.insert(roomTypes).values(
    createdHotels.flatMap((h, i) => [
      { hotelId: h.id, name: "Standard", capacity: 2, pricePerNight: 95 + (i % 4) * 10, totalRooms: 14 + (i % 5) },
      { hotelId: h.id, name: "Deluxe", capacity: 3, pricePerNight: 140 + (i % 4) * 15, totalRooms: 10 + (i % 4) },
      { hotelId: h.id, name: "Suite", capacity: 4, pricePerNight: 210 + (i % 4) * 20, totalRooms: 6 + (i % 3) },
    ])
  );

  hotelRows = await db.select({ id: hotels.id, name: hotels.name, partnerId: hotels.partnerId }).from(hotels).orderBy(asc(hotels.id));
  roomTypeRows = await db
    .select({ id: roomTypes.id, hotelId: roomTypes.hotelId, capacity: roomTypes.capacity, totalRooms: roomTypes.totalRooms })
    .from(roomTypes)
    .orderBy(asc(roomTypes.id));

  return { hotelRows, roomTypeRows };
}

function pickNights(rng: Rng) {
  const roll = rng();
  if (roll < 0.82) return randInt(rng, 1, 5);
  if (roll < 0.97) return randInt(rng, 6, 14);
  return randInt(rng, 15, 24);
}

async function seedLarge() {
  const rng = createRng();
  const now = new Date();

  console.log("[seed-large] starting");
  await cleanupOnlyThisSeedData();

  const roleIds = await ensureRoles();
  const passwordHash = await bcrypt.hash(RAW_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS ?? 10));

  const { hotelRows, roomTypeRows } = await ensureHotelRoomInventory({ partner: roleIds.partner }, passwordHash);

  const roomTypesByHotel = new Map<number, RoomTypeRecord[]>();
  for (const rt of roomTypeRows) {
    const group = roomTypesByHotel.get(rt.hotelId) ?? [];
    group.push(rt);
    roomTypesByHotel.set(rt.hotelId, group);
  }

  const candidateHotels = hotelRows.filter((h) => roomTypesByHotel.has(h.id));
  if (!candidateHotels.length) throw new Error("No hotels with room types available");

  const partnerUsers = await db.select({ partnerId: partners.id, userId: partners.userId }).from(partners);
  const partnerUserByPartner = new Map(partnerUsers.map((p) => [p.partnerId, p.userId]));

  const insertedUsers: { id: string; email: string }[] = [];
  for (const batch of chunk(Array.from({ length: TARGET_USERS }, (_, i) => ({ email: makeClientEmail(i + 1), passwordHash, isActive: true })), BATCH_SIZE)) {
    const rows = await db.insert(users).values(batch).returning({ id: users.id, email: users.email });
    insertedUsers.push(...rows);
  }

  for (const batch of chunk(insertedUsers.map((u) => ({ userId: u.id, roleId: roleIds.client })), BATCH_SIZE)) {
    await db.insert(userRoles).values(batch);
  }

  for (const batch of chunk(insertedUsers, BATCH_SIZE)) {
    await db.insert(userProfiles).values(
      batch.map((u, i) => {
        const idx = i % 10000;
        return {
          userId: u.id,
          fullName: `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${LAST_NAMES[(idx * 3) % LAST_NAMES.length]}`,
          phone: `+1-202-${String(1000000 + idx).slice(-7)}`,
          nationality: pick(rng, ["American", "Canadian", "British", "German", "French"] as const),
          gender: pick(rng, ["male", "female", "non-binary"] as const),
          street: `${100 + (idx % 900)} ${pick(rng, ["Maple", "Oak", "River", "Sunset", "Hill"] as const)} St`,
          city: pick(rng, CITIES),
          country: pick(rng, COUNTRIES),
          zip: String(10000 + (idx % 89999)).padStart(5, "0"),
        };
      })
    );
  }

  const userIds = insertedUsers.map((u) => u.id);

  let stripeIdSeq = 1;
  const nextStripeId = (prefix: "cs_test" | "pi_test" | "re_test") => `${prefix}_${String(stripeIdSeq++).padStart(9, "0")}`;

  const bookingSeedRows: BookingSeedRow[] = [];

  const buildBooking = (category: keyof typeof BOOKING_DISTRIBUTION): BookingSeedRow => {
    const hotel = candidateHotels[randInt(rng, 0, candidateHotels.length - 1)];
    const roomType = pick(rng, roomTypesByHotel.get(hotel.id)!);
    const userId = userIds[randInt(rng, 0, userIds.length - 1)];

    const roomsCount = rng() < 0.78 ? 1 : rng() < 0.96 ? 2 : 3;
    const guestsCapacity = roomType.capacity * roomsCount;
    const guestsCount = randInt(rng, 1, Math.max(1, guestsCapacity));

    const nights = pickNights(rng);

    let checkIn = now;
    let checkOut = now;

    if (category === "pastSuccessful") {
      checkIn = addDays(now, -randInt(rng, 20, 365));
      checkOut = addDays(checkIn, nights);
      if (checkOut >= now) {
        checkOut = addDays(now, -randInt(rng, 1, 7));
        checkIn = addDays(checkOut, -nights);
      }
    } else if (category === "currentActive") {
      checkIn = addDays(now, -randInt(rng, 0, 3));
      checkOut = addDays(now, randInt(rng, 1, 10));
      if (checkOut <= checkIn) checkOut = addDays(checkIn, 2);
    } else if (category === "futureUpcoming") {
      checkIn = addDays(now, randInt(rng, 1, 180));
      checkOut = addDays(checkIn, nights);
    } else if (category === "pendingHolds") {
      checkIn = addDays(now, randInt(rng, 2, 90));
      checkOut = addDays(checkIn, nights);
    } else {
      checkIn = addDays(now, -randInt(rng, 5, 220));
      checkOut = addDays(checkIn, nights);
    }

    let status = "confirmed";
    let paymentMethod: string | null = null;
    let paymentStatus: string | null = null;
    let stripeCheckoutSessionId: string | null = null;
    let stripePaymentIntentId: string | null = null;
    let stripeRefundId: string | null = null;
    let expiresAt: Date | null = null;

    if (category === "pendingHolds") {
      status = rng() < 0.65 ? "pending_payment" : "pending";
      paymentStatus = "pending";
      expiresAt = addDays(now, 1);
    } else if (category === "cancelledOrFailed") {
      status = "cancelled";
      if (rng() < 0.45) {
        paymentMethod = "cash_on_arrival";
        paymentStatus = "cancelled";
      } else {
        paymentMethod = "stripe";
        paymentStatus = pick(rng, ["failed", "cancelled", "refund_pending", "refunded", "refund_denied"] as const);
        stripeCheckoutSessionId = nextStripeId("cs_test");
        stripePaymentIntentId = nextStripeId("pi_test");
        if (paymentStatus === "refund_pending" || paymentStatus === "refunded" || paymentStatus === "refund_denied") {
          stripeRefundId = nextStripeId("re_test");
        }
      }
    } else {
      if (rng() < 0.62) {
        paymentMethod = "stripe";
        paymentStatus = "paid";
        stripeCheckoutSessionId = nextStripeId("cs_test");
        stripePaymentIntentId = nextStripeId("pi_test");
      } else {
        paymentMethod = "cash_on_arrival";
        paymentStatus = "pending";
      }

      if (category === "pastSuccessful" && rng() < 0.55) status = "completed";
    }

    return {
      roomTypeId: roomType.id,
      userId,
      hotelId: hotel.id,
      checkInDate: toDateOnly(checkIn),
      checkOutDate: toDateOnly(checkOut),
      guestsCount,
      roomsCount,
      status,
      paymentMethod,
      paymentStatus,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      stripeRefundId,
      expiresAt,
      createdAt: addDays(checkIn, -randInt(rng, 1, 45)),
      reviewEligible: category === "pastSuccessful",
    };
  };

  (Object.entries(BOOKING_DISTRIBUTION) as Array<[keyof typeof BOOKING_DISTRIBUTION, number]>).forEach(([category, count]) => {
    for (let i = 0; i < count; i++) bookingSeedRows.push(buildBooking(category));
  });

  if (bookingSeedRows.length !== TARGET_BOOKINGS) {
    throw new Error(`Expected ${TARGET_BOOKINGS} bookings, generated ${bookingSeedRows.length}`);
  }

  const reviewableRefs: ReviewableBookingRef[] = [];

  for (const batch of chunk(bookingSeedRows, BATCH_SIZE)) {
    const inserted = await db
      .insert(bookings)
      .values(
        batch.map((row) => ({
          roomTypeId: row.roomTypeId,
          userId: row.userId,
          checkInDate: row.checkInDate,
          checkOutDate: row.checkOutDate,
          guestsCount: row.guestsCount,
          roomsCount: row.roomsCount,
          status: row.status,
          paymentMethod: row.paymentMethod,
          paymentStatus: row.paymentStatus,
          stripeCheckoutSessionId: row.stripeCheckoutSessionId,
          stripePaymentIntentId: row.stripePaymentIntentId,
          stripeRefundId: row.stripeRefundId,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
        }))
      )
      .returning({ id: bookings.id });

    for (let i = 0; i < inserted.length; i++) {
      if (batch[i].reviewEligible) {
        reviewableRefs.push({
          bookingId: inserted[i].id,
          userId: batch[i].userId,
          hotelId: batch[i].hotelId,
          checkOutDate: batch[i].checkOutDate,
        });
      }
    }
  }

  if (reviewableRefs.length < TARGET_REVIEWS) {
    throw new Error(`Eligible review bookings ${reviewableRefs.length} is below required ${TARGET_REVIEWS}`);
  }

  const pickedForReview = shuffleInPlace(rng, [...reviewableRefs]).slice(0, TARGET_REVIEWS);

  const replyTarget = Math.ceil(TARGET_REVIEWS * 0.6);
  let repliesCount = 0;

  const reviewRows = pickedForReview.map((ref, idx) => {
    const reviewCreatedAt = addDays(new Date(`${ref.checkOutDate}T12:00:00.000Z`), randInt(rng, 1, 25));
    const shouldReply = idx < replyTarget;
    const partnerUserId = shouldReply
      ? partnerUserByPartner.get(hotelRows.find((h) => h.id === ref.hotelId)?.partnerId ?? "") ?? null
      : null;

    const partnerReply = shouldReply ? pick(rng, REVIEW_REPLY_POOL) : null;
    const partnerRepliedAt = shouldReply ? addDays(reviewCreatedAt, randInt(rng, 1, 7)) : null;

    if (partnerReply && partnerRepliedAt && partnerUserId) repliesCount++;

    const ratingRoll = rng();
    const rating = ratingRoll < 0.05 ? 2 : ratingRoll < 0.22 ? 3 : ratingRoll < 0.58 ? 4 : 5;

    return {
      userId: ref.userId,
      hotelId: ref.hotelId,
      bookingId: ref.bookingId,
      rating,
      comment: pick(rng, REVIEW_COMMENT_POOL),
      moderationStatus: "published",
      partnerReply,
      partnerRepliedAt,
      partnerRepliedBy: partnerUserId,
      createdAt: reviewCreatedAt,
      updatedAt: partnerRepliedAt ?? reviewCreatedAt,
    };
  });

  for (const batch of chunk(reviewRows, BATCH_SIZE)) {
    await db.insert(reviews).values(batch);
  }

  const earliestCheckIn = bookingSeedRows.reduce((min, row) => (row.checkInDate < min ? row.checkInDate : min), bookingSeedRows[0].checkInDate);
  const latestCheckOut = bookingSeedRows.reduce((max, row) => (row.checkOutDate > max ? row.checkOutDate : max), bookingSeedRows[0].checkOutDate);

  const hotelsUsed = new Set(bookingSeedRows.map((b) => b.hotelId)).size;
  const roomTypesUsed = new Set(bookingSeedRows.map((b) => b.roomTypeId)).size;
  const cancelledOrFailed = BOOKING_DISTRIBUTION.cancelledOrFailed;

  if (cancelledOrFailed > MAX_CANCELLED_OR_FAILED) throw new Error("Cancelled/failed/unfulfilled cap exceeded");
  if (reviewRows.length < 10001) throw new Error("Review minimum not satisfied");
  if (repliesCount < Math.ceil(reviewRows.length * 0.5)) throw new Error("Reply ratio below 50%");

  console.log("[seed-large] Completed");
  console.log(`users created: ${insertedUsers.length}`);
  console.log(`bookings created: ${bookingSeedRows.length}`);
  console.log(`reviews created: ${reviewRows.length}`);
  console.log(`reviews with replies: ${repliesCount}`);
  console.log(`cancelled/failed/unfulfilled count: ${cancelledOrFailed}`);
  console.log(`date range covered: ${earliestCheckIn} -> ${latestCheckOut}`);
  console.log(`hotels used: ${hotelsUsed}`);
  console.log(`room types used: ${roomTypesUsed}`);
}

seedLarge().catch((error) => {
  console.error("[seed-large] Failed", error);
  process.exitCode = 1;
});
