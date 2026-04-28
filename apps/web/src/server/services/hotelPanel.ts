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
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { hotelImages, hotels } from "../../db/schema";
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

export default {
  getHotelPanelData,
  getListingById,
};
