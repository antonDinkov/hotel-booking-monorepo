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
import { and, eq, gte, ilike, lt, gt, sql } from "drizzle-orm";

import { db } from "../../db";
import { hotelImages, hotels, roomTypes, bookings } from "../../db/schema";
import type { HotelPanelData, Listing, ListingDetails } from "../../types/hotel-panel";

export async function getHotelPanelData(): Promise<HotelPanelData> {
    const rows = await db
        .select({
            id: hotels.id,
            name: hotels.name,
            location: hotels.location,
            imageUrl: hotelImages.url,
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
            pricePerNight: hotels.pricePerNight,
        })
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .then((rows) => rows[0]);

    if (!hotel) return null;

    const images = await db
        .select({ url: hotelImages.url })
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
        price: hotel.pricePerNight,
        pricePerNight: `$${hotel.pricePerNight} per night`,
        location: hotel.location,
        bedrooms: 2,
        bathrooms: 1,
        guests: 4,
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
            url: hotelImages.url,
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
                .select()
                .from(bookings)
                .where(
                    and(
                        eq(bookings.roomTypeId, roomType.id),
                        eq(bookings.status, "confirmed")
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
                    const key = d.toISOString().slice(0, 10);
                    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
                }
            }

            let isAvailable = true;

            for (
                let d = new Date(checkInDate);
                d < new Date(checkOutDate);
                d.setDate(d.getDate() + 1)
            ) {
                const key = d.toISOString().slice(0, 10);
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