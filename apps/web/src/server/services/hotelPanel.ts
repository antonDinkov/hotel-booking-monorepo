/**
 * Service Layer: hotelPanel
 *
 * Responsibilities:
 * - Contain business logic and direct database access.
 * - Export reusable functions that can be called by API route handlers
 *   and by server-side UI components without making HTTP requests.
 *
 * Why service layer?
 * - Avoids internal HTTP calls between server components and API routes.
 * - Keeps API layer thin (only request/response handling).
 * - Makes logic reusable for mobile clients by exposing the same
 *   underlying behavior behind an HTTP API.
 */
import { and, asc, desc, eq, gt, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";

import { resolveImageUrl } from "@/lib/image-urls";
import { db } from "../../db";
import { bookings, hotelImages, hotels, roomTypes } from "../../db/schema";
import type { HotelPanelData, Listing, ListingDetails, ListingSearchResult } from "../../types/hotel-panel";
import type { RoomAvailability } from "../../types/room-availability";
import { getHotelReviewSummariesByHotelIds } from "./reviews";

type BookingRange = { checkInDate: string; checkOutDate: string; roomsCount: number | null };
type SearchPaginationInput = { page?: number; pageSize?: number };
type SearchCte = ReturnType<typeof sql>;
type SearchHotelRow = { id: number; name: string; location: string; isFeatured: boolean };
type SearchPaginationState = { page: number; pageSize: number; totalItems: number; totalPages: number };

const DEFAULT_HOTEL_IMAGE =
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_SEARCH_PAGE_SIZE = 9;
const MAX_SEARCH_PAGE_SIZE = 24;

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function normalizeExpiredPendingBookings(now = new Date()): Promise<void> {
    await db
        .update(bookings)
        .set({
            status: "cancelled",
            paymentStatus: "cancelled",
            expiresAt: null,
        })
        .where(
            and(
                or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")),
                lte(bookings.expiresAt, now)
            )
        );
}

function normalizeSearchPagination(input?: SearchPaginationInput) {
    if (!input) return null;

    const requestedPage = input.page ?? 1;
    const requestedPageSize = input.pageSize ?? DEFAULT_SEARCH_PAGE_SIZE;
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
        ? Math.min(requestedPageSize, MAX_SEARCH_PAGE_SIZE)
        : DEFAULT_SEARCH_PAGE_SIZE;

    return { page, pageSize };
}

function buildSearchAvailabilityCte(input: {
    destinationPattern: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
}) {
    return sql`
        with matching_hotels as (
            select h.id, h.name, h.location, h.registered_at, h.is_featured
            from hotels h
            where h.location ilike ${input.destinationPattern}
        ),
        date_range as (
            select generate_series(
                ${input.checkInDate}::date,
                (${input.checkOutDate}::date - interval '1 day'),
                interval '1 day'
            )::date as day
        ),
        active_bookings as (
            select
                b.room_type_id,
                b.check_in_date,
                b.check_out_date,
                coalesce(b.rooms_count, 1) as rooms_count
            from bookings b
            inner join room_types rt on rt.id = b.room_type_id
            inner join matching_hotels mh on mh.id = rt.hotel_id
            where b.check_in_date < ${input.checkOutDate}::date
              and b.check_out_date > ${input.checkInDate}::date
              and (
                b.status = 'confirmed'
                or (b.status in ('pending', 'pending_payment') and b.expires_at > now())
              )
        ),
        booked_per_day as (
            select
                ab.room_type_id,
                d.day,
                sum(ab.rooms_count)::int as booked_rooms
            from date_range d
            inner join active_bookings ab
              on d.day >= ab.check_in_date
             and d.day < ab.check_out_date
            group by ab.room_type_id, d.day
        ),
        max_booked as (
            select
                rt.id as room_type_id,
                rt.hotel_id,
                rt.total_rooms,
                rt.capacity,
                coalesce(max(bpd.booked_rooms), 0)::int as max_booked
            from room_types rt
            inner join matching_hotels mh on mh.id = rt.hotel_id
            left join booked_per_day bpd on bpd.room_type_id = rt.id
            group by rt.id
        ),
        eligible_room_types as (
            select room_type_id, hotel_id
            from max_booked
            where (total_rooms - max_booked) >= ceil(${input.guestsCount}::numeric / greatest(capacity, 1))
        )
    `;
}

async function getCoverImagesByHotelIds(hotelIds: number[]): Promise<Map<number, string>> {
    if (hotelIds.length === 0) return new Map();

    const rows = await db
        .select({ hotelId: hotelImages.hotelId, imageKey: hotelImages.imageKey })
        .from(hotelImages)
        .where(and(inArray(hotelImages.hotelId, hotelIds), isNull(hotelImages.roomTypeId)))
        .orderBy(desc(hotelImages.isCover), asc(hotelImages.sortOrder), asc(hotelImages.id));

    const imagesByHotelId = new Map<number, string>();
    for (const row of rows) {
        if (!imagesByHotelId.has(row.hotelId)) {
            imagesByHotelId.set(row.hotelId, resolveImageUrl(row.imageKey));
        }
    }

    return imagesByHotelId;
}

async function getSearchTotalItems(cte: SearchCte): Promise<number> {
    const countResult = await db.execute<{ value: number }>(sql`
        ${cte}
        select count(distinct mh.id)::int as value
        from matching_hotels mh
        inner join eligible_room_types ert on ert.hotel_id = mh.id
    `);

    return Number(countResult.rows[0]?.value ?? 0);
}

function buildSearchPaginationState(totalItems: number, pagination: { page: number; pageSize: number } | null): SearchPaginationState {
    const pageSize = pagination?.pageSize ?? Math.max(totalItems, 1);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = pagination ? Math.min(pagination.page, totalPages) : 1;

    return { page, pageSize, totalItems, totalPages };
}

async function getSearchHotelRows(cte: SearchCte, pagination: SearchPaginationState, isPaginated: boolean): Promise<SearchHotelRow[]> {
    const offset = isPaginated ? (pagination.page - 1) * pagination.pageSize : 0;
    const limitClause = isPaginated ? sql`limit ${pagination.pageSize} offset ${offset}` : sql``;

    const listResult = await db.execute<SearchHotelRow>(sql`
        ${cte}
        select distinct mh.id, mh.name, mh.location, mh.is_featured as "isFeatured"
        from matching_hotels mh
        inner join eligible_room_types ert on ert.hotel_id = mh.id
        order by mh.id asc
        ${limitClause}
    `);

    return listResult.rows ?? [];
}

async function buildListingsFromHotels(hotelRows: SearchHotelRow[]): Promise<Listing[]> {
    if (hotelRows.length === 0) return [];

    const hotelIds = hotelRows.map((row) => row.id);
    const [coverImages, reviewSummaries, minPrices] = await Promise.all([
        getCoverImagesByHotelIds(hotelIds),
        getHotelReviewSummariesByHotelIds(hotelIds),
        getMinPricesByHotelIds(hotelIds),
    ]);

    return hotelRows
        .map((hotel) => {
            const summary = reviewSummaries.get(hotel.id);
            if (!summary) return null;

            return {
                id: String(hotel.id),
                name: hotel.name,
                category: hotel.location,
                rating: summary.averageRating,
                ratingLabel: summary.ratingLabel,
                reviewLabel: summary.reviewLabel,
                trustBadge: summary.trustBadge,
                isFeatured: hotel.isFeatured,
                minPrice: minPrices.get(hotel.id) ?? null,
                image: {
                    src: coverImages.get(hotel.id) ?? DEFAULT_HOTEL_IMAGE,
                    alt: `${hotel.name} cover image`,
                },
            } as Listing;
        })
        .filter((listing): listing is Listing => Boolean(listing));
}

async function getMinPricesByHotelIds(hotelIds: number[]): Promise<Map<number, number>> {
    if (hotelIds.length === 0) return new Map();

    const rows = await db
        .select({
            hotelId: roomTypes.hotelId,
            minPrice: sql<number>`min(${roomTypes.pricePerNight})`,
        })
        .from(roomTypes)
        .where(inArray(roomTypes.hotelId, hotelIds))
        .groupBy(roomTypes.hotelId);

    const minPrices = new Map<number, number>();
    for (const row of rows) {
        if (typeof row.minPrice === "number") {
            minPrices.set(row.hotelId, row.minPrice);
        }
    }

    return minPrices;
}

export async function getHotelPanelData(): Promise<HotelPanelData> {
    const rows = await db
        .select({
            id: hotels.id,
            name: hotels.name,
            location: hotels.location,
            imageUrl: hotelImages.imageKey,
        })
        .from(hotels)
        .leftJoin(hotelImages, and(eq(hotelImages.hotelId, hotels.id), isNull(hotelImages.roomTypeId)))
        .where(eq(hotels.isFeatured, true));

    const featuredMap = new Map<number, Listing>();
    const hotelIds = Array.from(new Set(rows.map((row) => row.id)));
    const reviewSummaries = await getHotelReviewSummariesByHotelIds(hotelIds);

    for (const row of rows) {
        const summary = reviewSummaries.get(row.id);
        if (!summary) continue;

        if (!featuredMap.has(row.id)) {
            featuredMap.set(row.id, {
                id: String(row.id),
                name: row.name,
                category: row.location,
                rating: summary.averageRating,
                ratingLabel: summary.ratingLabel,
                reviewLabel: summary.reviewLabel,
                trustBadge: summary.trustBadge,
                image: {
                    src: row.imageUrl ? resolveImageUrl(row.imageUrl) :
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                    alt: `${row.name} cover image`,
                },
            });
        }
    }

    const panelData: HotelPanelData = {
        brand: { name: "BookYourStay" },
        navigation: {
            primaryAction: "Sign In",
            secondaryAction: "For Hosts",
        },
        hero: {
            eyebrow: "Travel smarter",
            title: "Find Your Perfect Stay",
            description: "Browse featured hotels powered by live Neon data.",
            image: {
                src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
                alt: "Oceanfront resort at sunset",
            },
        },
        search: { cta: "Search" },
        searchFields: [
            { label: "Destination", placeholder: "Where to?", icon: "pin" },
            { label: "Check In - Check Out", placeholder: "Pick dates", icon: "calendar" },
            { label: "Guests", placeholder: "2 adults", icon: "guests" },
        ],
        featuredHeading: {
            title: "Featured Stays",
            subtitle: "Data served from Neon PostgreSQL",
        },
        featuredListings: Array.from(featuredMap.values()),
    };

    return panelData;
}

export async function getListingById(id: string | number): Promise<ListingDetails | null> {
    const hotelId = typeof id === "string" ? Number(id) : id;
    if (Number.isNaN(hotelId)) return null;

    const hotel = await db
        .select({
            id: hotels.id,
            name: hotels.name,
            location: hotels.location,
            description: hotels.description,
        })
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .then((rows) => rows[0]);

    if (!hotel) return null;

    const reviewSummaries = await getHotelReviewSummariesByHotelIds([hotelId]);
    const reviewSummary = reviewSummaries.get(hotelId);
    if (!reviewSummary) return null;

    const roomTypesData = await db
        .select({ pricePerNight: roomTypes.pricePerNight })
        .from(roomTypes)
        .where(eq(roomTypes.hotelId, hotelId));

    const minPrice = roomTypesData.length
        ? Math.min(...roomTypesData.map((roomType) => roomType.pricePerNight))
        : 0;

    const images = await db
        .select({ url: hotelImages.imageKey })
        .from(hotelImages)
        .where(and(eq(hotelImages.hotelId, hotelId), isNull(hotelImages.roomTypeId)));

    const gallery = images.length
        ? images.map((img, index) => ({ src: resolveImageUrl(img.url), alt: `${hotel.name} image ${index + 1}` }))
        : [
            {
                src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                alt: `${hotel.name} cover image`,
            },
        ];

    const listing: ListingDetails = {
        id: String(hotel.id),
        name: hotel.name,
        category: "Hotel",
        rating: reviewSummary.averageRating,
        ratingLabel: reviewSummary.ratingLabel,
        reviewLabel: reviewSummary.reviewLabel,
        trustBadge: reviewSummary.trustBadge,
        image: gallery[0],
        description: hotel.description ?? `${hotel.name} is located in ${hotel.location}.`,
        price: minPrice,
        pricePerNight: `From $${minPrice} per night`,
        location: hotel.location,
        amenities: [
            { icon: "📶", name: "Fast Wi-Fi" },
            { icon: "🛏️", name: "Comfort Bedding" },
            { icon: "🧹", name: "Daily Cleaning" },
            { icon: "🛎️", name: "24/7 Front Desk" },
            { icon: "❄️", name: "Air Conditioning" },
            { icon: "🚗", name: "Parking" },
        ],
        images: gallery,
        highlights: ["Flexible cancellation", "Great location", "Trusted host", "Easy check-in"],
    };

    return listing;
}

function calculateAvailableRooms(
    totalRooms: number,
    bookingsData: BookingRange[],
    checkInDate: string,
    checkOutDate: string
): number {
    const dailyMap = new Map<string, number>();

    for (const booking of bookingsData) {
        const start = new Date(booking.checkInDate);
        const end = new Date(booking.checkOutDate);

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const key = formatDateKey(d);
            dailyMap.set(key, (dailyMap.get(key) || 0) + Math.max(1, booking.roomsCount ?? 1));
        }
    }

    let minAvailable = totalRooms;
    for (let d = new Date(checkInDate); d < new Date(checkOutDate); d.setDate(d.getDate() + 1)) {
        const key = formatDateKey(d);
        const booked = dailyMap.get(key) || 0;
        minAvailable = Math.min(minAvailable, totalRooms - booked);
    }

    return Math.max(0, minAvailable);
}

function getRequiredRoomsForGuests(guestsCount: number, capacity: number): number {
    return Math.ceil(guestsCount / Math.max(1, capacity));
}

export async function getRoomAvailabilityForHotel(
    hotelId: number,
    checkInDate: string,
    checkOutDate: string,
    guestsCount: number
): Promise<RoomAvailability[]> {
    await normalizeExpiredPendingBookings();

    if (!checkInDate || !checkOutDate || guestsCount < 1) return [];

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
        return [];
    }

    const roomTypesData = await db
        .select({
            id: roomTypes.id,
            name: roomTypes.name,
            capacity: roomTypes.capacity,
            pricePerNight: roomTypes.pricePerNight,
            totalRooms: roomTypes.totalRooms,
        })
        .from(roomTypes)
        .where(eq(roomTypes.hotelId, hotelId));

    if (roomTypesData.length === 0) return [];

    const roomTypeIds = roomTypesData.map((roomType) => roomType.id);
    const bookingsData = await db
        .select({
            checkInDate: bookings.checkInDate,
            checkOutDate: bookings.checkOutDate,
            roomTypeId: bookings.roomTypeId,
            roomsCount: bookings.roomsCount,
        })
        .from(bookings)
        .where(
            and(
                inArray(bookings.roomTypeId, roomTypeIds),
                or(
                    eq(bookings.status, "confirmed"),
                    and(or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")), gt(bookings.expiresAt, new Date()))
                ),
                lt(bookings.checkInDate, checkOutDate),
                gt(bookings.checkOutDate, checkInDate)
            )
        );

    const bookingsByRoomType = new Map<number, BookingRange[]>();
    for (const booking of bookingsData) {
        const list = bookingsByRoomType.get(booking.roomTypeId) ?? [];
        list.push({
            checkInDate: String(booking.checkInDate),
            checkOutDate: String(booking.checkOutDate),
            roomsCount: booking.roomsCount,
        });
        bookingsByRoomType.set(booking.roomTypeId, list);
    }

    return roomTypesData
        .map((roomType) => {
            const bookingRanges = bookingsByRoomType.get(roomType.id) ?? [];
            const availableRooms = calculateAvailableRooms(
                roomType.totalRooms,
                bookingRanges,
                checkInDate,
                checkOutDate
            );

            return {
                roomTypeId: roomType.id,
                name: roomType.name,
                capacity: roomType.capacity,
                pricePerNight: roomType.pricePerNight,
                totalRooms: roomType.totalRooms,
                availableRooms,
                requiredRooms: getRequiredRoomsForGuests(guestsCount, roomType.capacity),
            };
        })
        .filter((roomType) => roomType.availableRooms >= roomType.requiredRooms);
}

export async function searchAvailableHotels(
    destination: string,
    checkInDate: string,
    checkOutDate: string,
    guestsCount: number
): Promise<Listing[]> {
    const result = await searchAvailableHotelsPage({
        destination,
        checkInDate,
        checkOutDate,
        guestsCount,
    });

    return result.listings;
}

export async function searchAvailableHotelsPage(input: {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    guestsCount: number;
    pagination?: SearchPaginationInput;
}): Promise<ListingSearchResult> {
    await normalizeExpiredPendingBookings();

    const destinationPattern = `%${input.destination.trim()}%`;
    const pagination = normalizeSearchPagination(input.pagination);
    const cte = buildSearchAvailabilityCte({
        destinationPattern,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        guestsCount: input.guestsCount,
    });

    const totalItems = await getSearchTotalItems(cte);
    const paginationState = buildSearchPaginationState(totalItems, pagination);
    const hotelRows = await getSearchHotelRows(cte, paginationState, Boolean(pagination));
    const listings = await buildListingsFromHotels(hotelRows);

    return {
        listings,
        pagination: paginationState,
    };
}
