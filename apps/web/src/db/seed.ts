import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { bookings, hotelImages, hotels, roomTypes } from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

/* function buildImageUrls(hotelId: number): string[] {
    return [
        `https://picsum.photos/seed/hotel-${hotelId}-1/1200/800`,
        `https://picsum.photos/seed/hotel-${hotelId}-2/1200/800`,
        `https://picsum.photos/seed/hotel-${hotelId}-3/1200/800`,
    ];
}

async function verifyImageUrls(urls: string[]) {
    const checks = await Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url, { method: "GET" });
                return { url, ok: response.ok, status: response.status };
            } catch {
                return { url, ok: false, status: 0 };
            }
        }),
    );

    const failed = checks.filter((check) => !check.ok);

    if (failed.length > 0) {
        throw new Error(
            `Image URL validation failed for ${failed.length} URLs: ${failed.map((item) => `${item.url} (${item.status})`).join(", ")}`,
        );
    }
} */

async function getWorkingImages(urls: string[]): Promise<string[]> {
    const results: string[] = [];

    for (const url of urls) {
        try {
            const res = await fetch(url, { method: "HEAD" });
            if (res.ok) {
                results.push(url);
            }
        } catch {
            // ignore
        }
    }

    return results;
}

const hotelImagesMap: Record<string, string[]> = {
    "Cedar Peak Hotel": [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108d",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
    ],
    "Harborline Suites": [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    "Savana Garden Inn": [
        "https://images.unsplash.com/photo-1560448075-bb485b067938",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427",
    ],
    "Blue Dune Resort": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    ],
    "Metropole 88": [
        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
        "https://images.unsplash.com/photo-1521783988139-893ce6f3c5a4",
    ],
    "Palm Crest Hotel": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1576678927484-cc907957088c",
        "https://images.unsplash.com/photo-1549294413-26f195200c16",
    ],
    "Riverside Atelier": [
        "https://images.unsplash.com/photo-1551776235-dde6d4829808",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    "Northwind Lodge": [
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
        "https://images.unsplash.com/photo-1505692794403-35e6e6a5c5a8",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    ],
    "Lagoon Bay Hotel": [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108d",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
        "https://images.unsplash.com/photo-1576678927484-cc907957088c",
    ],
    "Amber Court": [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427",
        "https://images.unsplash.com/photo-1560448075-bb485b067938",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
    ],
    "Cliffside Panorama": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
    ],
    "Kirana Heritage": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427",
    ],
    "Summit Bay": [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb2108d",
    ],
    "Moonlight Quarters": [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf",
        "https://images.unsplash.com/photo-1551776235-dde6d4829808",
    ],
    "Opal Garden Hotel": [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
        "https://images.unsplash.com/photo-1560448075-bb485b067938",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    ],
    "Aurora Sky": [
        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
        "https://images.unsplash.com/photo-1505692794403-35e6e6a5c5a8",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    ],
    "Terra Nova Inn": [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
    ],
    "Verde Palace": [
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    ],
    "Regatta Point": [
        "https://images.unsplash.com/photo-1551776235-dde6d4829808",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    ],
    "Pinefield Residence": [
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
        "https://images.unsplash.com/photo-1505692794403-35e6e6a5c5a8",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    ],
};

const hotelsSeed = [
    {
        name: "Cedar Peak Hotel",
        location: "Bandung, Indonesia",
        description: "Modern mountain-view stay near Lembang.",
        pricePerNight: 78,
        ownerId: 1,
        isFeatured: true,
    },
    {
        name: "Harborline Suites",
        location: "Surabaya, Indonesia",
        description: "Business-friendly suites close to the harbor district.",
        pricePerNight: 69,
        ownerId: 2,
        isFeatured: false,
    },
    {
        name: "Savana Garden Inn",
        location: "Yogyakarta, Indonesia",
        description: "Quiet boutique hotel near Malioboro.",
        pricePerNight: 54,
        ownerId: 3,
        isFeatured: true,
    },
    {
        name: "Blue Dune Resort",
        location: "Lombok, Indonesia",
        description: "Beachside resort with family villas.",
        pricePerNight: 124,
        ownerId: 4,
        isFeatured: true,
    },
    {
        name: "Metropole 88",
        location: "Jakarta, Indonesia",
        description: "City-center hotel in Sudirman area.",
        pricePerNight: 87,
        ownerId: 5,
        isFeatured: false,
    },
    {
        name: "Palm Crest Hotel",
        location: "Bali, Indonesia",
        description: "Tropical-inspired hotel near Seminyak.",
        pricePerNight: 116,
        ownerId: 6,
        isFeatured: true,
    },
    {
        name: "Riverside Atelier",
        location: "Solo, Indonesia",
        description: "Minimalist hotel along the river promenade.",
        pricePerNight: 51,
        ownerId: 7,
        isFeatured: false,
    },
    {
        name: "Northwind Lodge",
        location: "Medan, Indonesia",
        description: "Cozy urban lodge with curated local dining.",
        pricePerNight: 56,
        ownerId: 8,
        isFeatured: false,
    },
    {
        name: "Lagoon Bay Hotel",
        location: "Batam, Indonesia",
        description: "Spacious rooms with bay-facing balconies.",
        pricePerNight: 72,
        ownerId: 9,
        isFeatured: true,
    },
    {
        name: "Amber Court",
        location: "Semarang, Indonesia",
        description: "Classic comfort stay in downtown Semarang.",
        pricePerNight: 47,
        ownerId: 10,
        isFeatured: false,
    },
    {
        name: "Cliffside Panorama",
        location: "Labuan Bajo, Indonesia",
        description: "Sunset-facing cliff hotel near marina.",
        pricePerNight: 131,
        ownerId: 11,
        isFeatured: true,
    },
    {
        name: "Kirana Heritage",
        location: "Malang, Indonesia",
        description: "Heritage concept hotel with garden courtyard.",
        pricePerNight: 62,
        ownerId: 12,
        isFeatured: false,
    },
    {
        name: "Summit Bay",
        location: "Manado, Indonesia",
        description: "Sea-view hotel popular with divers.",
        pricePerNight: 88,
        ownerId: 13,
        isFeatured: false,
    },
    {
        name: "Moonlight Quarters",
        location: "Mataram, Indonesia",
        description: "Calm contemporary rooms near central district.",
        pricePerNight: 59,
        ownerId: 14,
        isFeatured: true,
    },
    {
        name: "Opal Garden Hotel",
        location: "Makassar, Indonesia",
        description: "Fresh modern interiors and rooftop dining.",
        pricePerNight: 68,
        ownerId: 15,
        isFeatured: false,
    },
    {
        name: "Aurora Sky",
        location: "Balikpapan, Indonesia",
        description: "Elegant rooms with skyline views.",
        pricePerNight: 76,
        ownerId: 16,
        isFeatured: false,
    },
    {
        name: "Terra Nova Inn",
        location: "Palembang, Indonesia",
        description: "Comfort-focused hotel near river attractions.",
        pricePerNight: 53,
        ownerId: 17,
        isFeatured: false,
    },
    {
        name: "Verde Palace",
        location: "Denpasar, Indonesia",
        description: "Upscale stay with spa and pool facilities.",
        pricePerNight: 145,
        ownerId: 18,
        isFeatured: true,
    },
    {
        name: "Regatta Point",
        location: "Banjarmasin, Indonesia",
        description: "Riverside property with spacious family rooms.",
        pricePerNight: 49,
        ownerId: 19,
        isFeatured: false,
    },
    {
        name: "Pinefield Residence",
        location: "Bogor, Indonesia",
        description: "Cool-weather retreat with pine garden paths.",
        pricePerNight: 64,
        ownerId: 20,
        isFeatured: true,
    },
];

async function seed() {
    await db.delete(bookings);
    await db.delete(hotelImages);
    await db.delete(roomTypes);
    await db.delete(hotels);

    const insertedHotels = await db.insert(hotels).values(hotelsSeed).returning({
        id: hotels.id,
        name: hotels.name,
        pricePerNight: hotels.pricePerNight,
    });

    const roomTypesSeed = insertedHotels.flatMap((hotel) => {
        const roomTypeConfigs = [
            { name: "Standard", capacity: 2, priceMultiplier: 1, roomBias: 1 },
            { name: "Deluxe", capacity: 3, priceMultiplier: 1.35, roomBias: 2 },
            { name: "Suite", capacity: 4, priceMultiplier: 1.8, roomBias: 3 },
        ] as const;

        const typesForHotel = hotel.id % 2 === 0 ? roomTypeConfigs.slice(0, 2) : roomTypeConfigs;

        return typesForHotel.map((typeConfig) => ({
            hotelId: hotel.id,
            name: typeConfig.name,
            capacity: typeConfig.capacity,
            pricePerNight: Math.round(hotel.pricePerNight * typeConfig.priceMultiplier),
            totalRooms: 3 + ((hotel.id + typeConfig.roomBias) % 8),
        }));
    });

    const insertedRoomTypes = await db.insert(roomTypes).values(roomTypesSeed).returning({
        id: roomTypes.id,
        capacity: roomTypes.capacity,
    });

    const summer2026 = new Date("2026-06-01T00:00:00.000Z");
    const bookingOffsets = [0, 2, 12, 18];

    const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

    const bookingsSeed = insertedRoomTypes.flatMap((roomType) => {
        const totalBookings = 2 + (roomType.id % 3);

        return Array.from({ length: totalBookings }, (_, index) => {
            const checkInOffset = (roomType.id * 7 + bookingOffsets[index]) % 92;
            const checkIn = new Date(summer2026);
            checkIn.setUTCDate(summer2026.getUTCDate() + checkInOffset);

            const nights = 2 + ((roomType.id + index) % 4);
            const checkOut = new Date(checkIn);
            checkOut.setUTCDate(checkIn.getUTCDate() + nights);

            return {
                roomTypeId: roomType.id,
                userId: ((roomType.id * 3 + index) % 40) + 1,
                checkInDate: toDateOnly(checkIn),
                checkOutDate: toDateOnly(checkOut),
                guestsCount: 1 + ((roomType.id + index) % roomType.capacity),
                status: "confirmed",
            };
        });
    });

    const insertedBookings = await db.insert(bookings).values(bookingsSeed).returning({
        id: bookings.id,
    });

    const hotelImagesSeed = (
        await Promise.all(
            insertedHotels.map(async (hotel) => {
                const rawImages = hotelImagesMap[hotel.name] ?? [];

                const validImages = await getWorkingImages(rawImages);

                const finalImages =
                    validImages.length > 0
                        ? validImages
                        : ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"];

                return finalImages.map((url) => ({
                    hotelId: hotel.id,
                    url,
                }));
            })
        )
    ).flat();

    /* await verifyImageUrls(hotelImagesSeed.map((entry) => entry.url)); */

    const insertedImages = await db
        .insert(hotelImages)
        .values(hotelImagesSeed)
        .returning({ id: hotelImages.id });

    console.log(`Inserted hotels: ${insertedHotels.length}`);
    console.log(`Inserted room types: ${insertedRoomTypes.length}`);
    console.log(`Inserted bookings: ${insertedBookings.length}`);
    console.log(`Inserted hotel images: ${insertedImages.length}`);
}

seed().catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
});
