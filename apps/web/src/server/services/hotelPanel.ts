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
import { eq, ilike, and, gte } from "drizzle-orm";

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
    footer: {
      text: "Copyright 2026 BookYourStay MVP | All Rights Reserved.",
    },
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

export async function searchHotels(destination?: string): Promise<Listing[]> {
  let query: any = db
    .select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      imageUrl: hotelImages.url,
    })
    .from(hotels)
    .leftJoin(hotelImages, eq(hotelImages.hotelId, hotels.id));

  if (destination) {
    query = query.where(
      ilike(hotels.location, `%${destination}%`)
    );
  }

  const rows = await query;

  const resultMap = new Map<number, Listing>();

  for (const row of rows) {
    if (!resultMap.has(row.id)) {
      resultMap.set(row.id, {
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

  return Array.from(resultMap.values());
}

export async function searchAvailableHotels(
  destination: string,
  checkInDate: string,
  checkOutDate: string,
  guestsCount: number
): Promise<Listing[]> {
  // Find all hotels matching the destination
  const hotelRows = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      imageUrl: hotelImages.url,
    })
    .from(hotels)
    .leftJoin(hotelImages, eq(hotelImages.hotelId, hotels.id))
    .where(
      ilike(hotels.location, `%${destination}%`)
    );

  const hotelMap = new Map<number, { name: string; location: string; images: string[] }>();

  for (const row of hotelRows) {
    if (!hotelMap.has(row.id)) {
      hotelMap.set(row.id, {
        name: row.name,
        location: row.location,
        images: [],
      });
    }
    if (row.imageUrl) {
      hotelMap.get(row.id)?.images.push(row.imageUrl);
    }
  }

  // For each hotel, check if there are available rooms for the requested dates and guests
  const availableHotels: Listing[] = [];

  for (const [hotelId, hotelInfo] of hotelMap.entries()) {
    // Find room types in this hotel that can fit the guests
    const availableRoomTypes = await db
      .select({
        id: roomTypes.id,
        totalRooms: roomTypes.totalRooms,
        capacity: roomTypes.capacity,
      })
      .from(roomTypes)
      .where(
        and(
          eq(roomTypes.hotelId, hotelId),
          gte(roomTypes.capacity, guestsCount)
        )
      );

    // Check if any room type has availability (no conflicting bookings)
    let hasAvailableRooms = false;

    const searchStart = new Date(`${checkInDate}T00:00:00.000Z`);
    const searchEnd = new Date(`${checkOutDate}T00:00:00.000Z`);

    const formatDateKey = (dateValue: Date | string) => {
      const date = typeof dateValue === "string"
        ? new Date(`${dateValue}T00:00:00.000Z`)
        : new Date(dateValue);
      return date.toISOString().slice(0, 10);
    };

    for (const roomType of availableRoomTypes) {
      // Fetch all confirmed bookings for this room type
      const allBookings = await db
        .select({
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.roomTypeId, roomType.id),
            eq(bookings.status, "confirmed")
          )
        );

      // Track bookings per day within the requested window
      const dailyBookings = new Map<string, number>();

      for (const booking of allBookings) {
        const bookingStart = new Date(`${formatDateKey(booking.checkInDate)}T00:00:00.000Z`);
        const bookingEnd = new Date(`${formatDateKey(booking.checkOutDate)}T00:00:00.000Z`);

        if (bookingEnd <= searchStart || bookingStart >= searchEnd) continue;

        const overlapStart = bookingStart > searchStart ? bookingStart : searchStart;
        const overlapEnd = bookingEnd < searchEnd ? bookingEnd : searchEnd;

        for (let day = new Date(overlapStart); day < overlapEnd; day.setUTCDate(day.getUTCDate() + 1)) {
          const key = day.toISOString().slice(0, 10);
          dailyBookings.set(key, (dailyBookings.get(key) ?? 0) + 1);
        }
      }

      let maxConcurrentBookings = 0;
      for (let day = new Date(searchStart); day < searchEnd; day.setUTCDate(day.getUTCDate() + 1)) {
        const key = day.toISOString().slice(0, 10);
        maxConcurrentBookings = Math.max(maxConcurrentBookings, dailyBookings.get(key) ?? 0);
      }

      if (roomType.totalRooms - maxConcurrentBookings > 0) {
        hasAvailableRooms = true;
        break;
      }
    }

    if (hasAvailableRooms) {
      const imageUrl =
        hotelInfo.images.length > 0
          ? hotelInfo.images[0]
          : "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

      availableHotels.push({
        id: String(hotelId),
        name: hotelInfo.name,
        category: hotelInfo.location,
        rating: 4.7,
        reviewLabel: "Verified stays",
        image: {
          src: imageUrl,
          alt: `${hotelInfo.name} cover image`,
        },
      });
    }
  }

  return availableHotels;
}

export default {
  getHotelPanelData,
  getListingById,
  searchHotels,
  searchAvailableHotels,
};
