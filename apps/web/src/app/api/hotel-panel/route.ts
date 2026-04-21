import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "../../../db";
import { hotelImages, hotels } from "../../../db/schema";
import type { HotelPanelData, Listing } from "../../../types/hotel-panel";

export async function GET() {
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
          src:
            row.imageUrl ??
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
      {
        label: "Check In - Check Out",
        placeholder: "Pick dates",
        icon: "calendar",
      },
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

  return NextResponse.json(panelData);
}