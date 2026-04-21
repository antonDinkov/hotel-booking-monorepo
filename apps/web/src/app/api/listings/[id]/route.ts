import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "../../../../db";
import { hotelImages, hotels } from "../../../../db/schema";
import type { ListingDetails } from "../../../../types/hotel-panel";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hotelId = Number(id);

  if (Number.isNaN(hotelId)) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

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

  if (!hotel) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const images = await db
    .select({ url: hotelImages.url })
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotelId));

  const gallery = images.length
    ? images.map((img, index) => ({
        src: img.url,
        alt: `${hotel.name} image ${index + 1}`,
      }))
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
    highlights: [
      "Flexible cancellation",
      "Great location",
      "Trusted host",
      "Easy check-in",
    ],
  };

  return NextResponse.json(listing);
}
