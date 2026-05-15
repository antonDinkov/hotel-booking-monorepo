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
import { and, eq, gte, ilike, lt, gt, inArray, or } from "drizzle-orm";

import { db } from "../../db";
import { hotelImages, hotels, roomTypes, bookings } from "../../db/schema";
import type { HotelPanelData, Listing, ListingDetails } from "../../types/hotel-panel";
import type { RoomAvailability } from "../../types/room-availability";

type BookingRange = { checkInDate: string; checkOutDate: string; roomsCount: number | null };

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
        .leftJoin(hotelImages, eq(hotelImages.hotelId, hotels.id))
        .where(eq(hotels.isFeatured, true));

    const featuredMap = new Map<number, Listing>();

    for (const row of rows) {
        if (!featuredMap.has(row.id)) {
            featuredMap.set(row.id, {
                id: String(row.id),
                name: row.name,
                category: row.location,
                rating: 4.7,
                reviewLabel: "Verified stays",
                image: {
                    src: row.imageUrl ??
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
        .where(eq(hotelImages.hotelId, hotelId));

    const gallery = images.length
        ? images.map((img, index) => ({ src: img.url, alt: `${hotel.name} image ${index + 1}` }))
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
        rating: 4.7,
        reviewLabel: "Verified stays",
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

export async function getRoomAvailabilityForHotel(
    hotelId: number,
    checkInDate: string,
    checkOutDate: string,
    guestsCount: number
): Promise<RoomAvailability[]> {
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
        .where(and(eq(roomTypes.hotelId, hotelId), gte(roomTypes.capacity, guestsCount)));

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
            };
        })
        .filter((roomType) => roomType.availableRooms > 0);
}

export async function searchAvailableHotels(
    destination: string,
    checkInDate: string,
    checkOutDate: string,
    guestsCount: number
): Promise<Listing[]> {
    const hotelsData = await db
        .select()
        .from(hotels)
        .where(ilike(hotels.location, `%${destination}%`));

    // 👉 взимаме всички images
    const images = await db
        .select({
            hotelId: hotelImages.hotelId,
            url: hotelImages.imageKey,
        })
        .from(hotelImages);

    // 👉 map: hotelId -> first image
    const imageMap = new Map<number, string>();

    for (const img of images) {
        if (!imageMap.has(img.hotelId)) {
            imageMap.set(img.hotelId, img.url);
        }
    }

    const results: Listing[] = [];

    for (const hotel of hotelsData) {
        const roomTypesData = await db
            .select()
            .from(roomTypes)
            .where(
                and(
                    eq(roomTypes.hotelId, hotel.id),
                    gte(roomTypes.capacity, guestsCount)
                )
            );

        let hasAvailability = false;

        for (const roomType of roomTypesData) {
            const bookingsData = await db
                .select({
                    checkInDate: bookings.checkInDate,
                    checkOutDate: bookings.checkOutDate,
                    roomsCount: bookings.roomsCount,
                })
                .from(bookings)
                .where(
                    and(
                        eq(bookings.roomTypeId, roomType.id),
                        or(
                            eq(bookings.status, "confirmed"),
                            and(or(eq(bookings.status, "pending_payment"), eq(bookings.status, "pending")), gt(bookings.expiresAt, new Date()))
                        ),
                        lt(bookings.checkInDate, checkOutDate),
                        gt(bookings.checkOutDate, checkInDate)
                    )
                );

            const dailyMap = new Map<string, number>();

            for (const booking of bookingsData) {
                const start = new Date(booking.checkInDate);
                const end = new Date(booking.checkOutDate);

                for (
                    let d = new Date(start);
                    d < end;
                    d.setDate(d.getDate() + 1)
                ) {
                    const key = formatDateKey(d);
                    dailyMap.set(key, (dailyMap.get(key) || 0) + Math.max(1, booking.roomsCount ?? 1));
                }
            }

            let isAvailable = true;

            for (
                let d = new Date(checkInDate);
                d < new Date(checkOutDate);
                d.setDate(d.getDate() + 1)
            ) {
                const key = formatDateKey(d);
                const booked = dailyMap.get(key) || 0;

                if (booked >= roomType.totalRooms) {
                    isAvailable = false;
                    break;
                }
            }

            if (isAvailable) {
                hasAvailability = true;
                break;
            }
        }

        if (hasAvailability) {
            results.push({
                id: String(hotel.id),
                name: hotel.name,
                category: hotel.location,
                rating: 4.7,
                reviewLabel: "Verified stays",
                image: {
                    src:
                        imageMap.get(hotel.id) ??
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
                    alt: `${hotel.name} cover image`,
                },
            });
        }
    }

    return results;
}
