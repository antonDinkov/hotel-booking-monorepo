import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import {
	bookings,
	hotelImages,
	hotelPaymentMethods,
	hotels,
	reviews,
	roles,
	roomTypes,
	userRoles,
	users,
	userProfiles,
} from "./schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

async function getWorkingImages(urls: string[]): Promise<string[]> {
	const results: string[] = [];

	for (const url of urls) {
		try {
			const res = await fetch(url, { method: "HEAD" });
			if (res.ok) {
				results.push(url);
			}
		} catch {
			// ignore image failures and continue with defaults
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
		"https://images.unsplash.com/photo-1571896349842-33d89424de2d",
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
		"https://images.unsplash.com/photo-1571896349842-33d89424de2d",
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

const hotelSeedData = [
	{
		name: "Cedar Peak Hotel",
		location: "Bandung, Indonesia",
		description: "Modern mountain-view stay near Lembang.",
		ownerIndex: 0,
		isFeatured: true,
	},
	{
		name: "Harborline Suites",
		location: "Surabaya, Indonesia",
		description: "Business-friendly suites close to the harbor district.",
		ownerIndex: 1,
		isFeatured: false,
	},
	{
		name: "Savana Garden Inn",
		location: "Yogyakarta, Indonesia",
		description: "Quiet boutique hotel near Malioboro.",
		ownerIndex: 2,
		isFeatured: true,
	},
	{
		name: "Blue Dune Resort",
		location: "Lombok, Indonesia",
		description: "Beachside resort with family villas.",
		ownerIndex: 3,
		isFeatured: true,
	},
	{
		name: "Metropole 88",
		location: "Jakarta, Indonesia",
		description: "City-center hotel in Sudirman area.",
		ownerIndex: 4,
		isFeatured: false,
	},
	{
		name: "Palm Crest Hotel",
		location: "Bali, Indonesia",
		description: "Tropical-inspired hotel near Seminyak.",
		ownerIndex: 5,
		isFeatured: true,
	},
	{
		name: "Riverside Atelier",
		location: "Solo, Indonesia",
		description: "Minimalist hotel along the river promenade.",
		ownerIndex: 6,
		isFeatured: false,
	},
	{
		name: "Northwind Lodge",
		location: "Medan, Indonesia",
		description: "Cozy urban lodge with curated local dining.",
		ownerIndex: 7,
		isFeatured: false,
	},
	{
		name: "Lagoon Bay Hotel",
		location: "Batam, Indonesia",
		description: "Spacious rooms with bay-facing balconies.",
		ownerIndex: 8,
		isFeatured: true,
	},
	{
		name: "Amber Court",
		location: "Semarang, Indonesia",
		description: "Classic comfort stay in downtown Semarang.",
		ownerIndex: 9,
		isFeatured: false,
	},
	{
		name: "Cliffside Panorama",
		location: "Labuan Bajo, Indonesia",
		description: "Sunset-facing cliff hotel near marina.",
		ownerIndex: 10,
		isFeatured: true,
	},
	{
		name: "Kirana Heritage",
		location: "Malang, Indonesia",
		description: "Heritage concept hotel with garden courtyard.",
		ownerIndex: 11,
		isFeatured: false,
	},
	{
		name: "Summit Bay",
		location: "Manado, Indonesia",
		description: "Sea-view hotel popular with divers.",
		ownerIndex: 12,
		isFeatured: false,
	},
	{
		name: "Moonlight Quarters",
		location: "Mataram, Indonesia",
		description: "Calm contemporary rooms near central district.",
		ownerIndex: 13,
		isFeatured: true,
	},
	{
		name: "Opal Garden Hotel",
		location: "Makassar, Indonesia",
		description: "Fresh modern interiors and rooftop dining.",
		ownerIndex: 14,
		isFeatured: false,
	},
	{
		name: "Aurora Sky",
		location: "Balikpapan, Indonesia",
		description: "Elegant rooms with skyline views.",
		ownerIndex: 15,
		isFeatured: false,
	},
	{
		name: "Terra Nova Inn",
		location: "Palembang, Indonesia",
		description: "Comfort-focused hotel near river attractions.",
		ownerIndex: 16,
		isFeatured: false,
	},
	{
		name: "Verde Palace",
		location: "Denpasar, Indonesia",
		description: "Upscale stay with spa and pool facilities.",
		ownerIndex: 17,
		isFeatured: true,
	},
	{
		name: "Regatta Point",
		location: "Banjarmasin, Indonesia",
		description: "Riverside property with spacious family rooms.",
		ownerIndex: 18,
		isFeatured: false,
	},
	{
		name: "Pinefield Residence",
		location: "Bogor, Indonesia",
		description: "Cool-weather retreat with pine garden paths.",
		ownerIndex: 19,
		isFeatured: true,
	},
];

const partnerUserEmails = Array.from({ length: 20 }, (_, index) => `partner${index + 1}@example.com`);
const guestUserEmails = Array.from({ length: 40 }, (_, index) => `user${index + 1}@example.com`);
const peterUserEmail = "peter@abv.bg";
const adminUserEmail = "admin@abv.bg";
const roleNames = ["client", "partner", "admin"] as const;
const defaultPassword = "123456";
const recentHotelCount = 6;
const recentHotelReviewCount = 4;
const establishedHotelReviewCount = 10;
const today = new Date();
const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number): Date => {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
};

async function seed() {
	await db.delete(reviews);
	await db.delete(bookings);
	await db.delete(hotelImages);
	await db.delete(hotelPaymentMethods);
	await db.delete(roomTypes);
	await db.delete(userRoles);
	await db.delete(hotels);
	await db.delete(roles);
	await db.delete(users);

	const insertedRoles = await db
		.insert(roles)
		.values(roleNames.map((name) => ({ name })))
		.returning({ id: roles.id, name: roles.name });

	const roleMap = insertedRoles.reduce((acc, role) => {
		acc[role.name] = role;
		return acc;
	}, {} as Record<string, { id: number; name: string }>);

	const passwordHash = await bcrypt.hash(defaultPassword, Number(process.env.BCRYPT_SALT_ROUNDS ?? 10));

	const partnerUsers = await db
		.insert(users)
		.values(
			partnerUserEmails.map((email) => ({
				email,
				passwordHash,
				isActive: true,
			}))
		)
		.returning({ id: users.id, email: users.email });

	const [peterUser] = await db
		.insert(users)
		.values({ email: peterUserEmail, passwordHash, isActive: true })
		.returning({ id: users.id, email: users.email });

	const [adminUser] = await db
		.insert(users)
		.values({ email: adminUserEmail, passwordHash, isActive: true })
		.returning({ id: users.id, email: users.email });

	const guestUsers = await db
		.insert(users)
		.values(
			guestUserEmails.map((email) => ({
				email,
				passwordHash,
				isActive: true,
			}))
		)
		.returning({ id: users.id, email: users.email });

	const userRolesSeed = [
		...partnerUsers.map((user) => ({ userId: user.id, roleId: roleMap.partner.id })),
		...guestUsers.map((user) => ({ userId: user.id, roleId: roleMap.client.id })),
		{ userId: peterUser.id, roleId: roleMap.client.id },
		{ userId: adminUser.id, roleId: roleMap.admin.id },
	];

	await db.insert(userRoles).values(userRolesSeed);

	const insertedHotels = await db
		.insert(hotels)
		.values(
			hotelSeedData.map((hotel, index) => ({
				name: hotel.name,
				location: hotel.location,
				description: hotel.description,
				ownerId: partnerUsers[hotel.ownerIndex].id,
				isFeatured: hotel.isFeatured,
				registeredAt: addDays(today, index < recentHotelCount ? -20 - index * 6 : -140 - index * 3),
			}))
		)
		.returning({ id: hotels.id, name: hotels.name, ownerId: hotels.ownerId });

	const hotelPaymentMethodsSeed = insertedHotels.flatMap((hotel) => [
		{
			hotelId: hotel.id,
			method: "stripe",
		},
		{
			hotelId: hotel.id,
			method: "cash_on_arrival",
		},
	]);

	await db.insert(hotelPaymentMethods).values(hotelPaymentMethodsSeed);

	console.log(`Inserted hotel payment methods: ${hotelPaymentMethodsSeed.length}`);

	// Seed user profiles for all users
	const allUsers = [...partnerUsers, peterUser, adminUser, ...guestUsers];
	const userProfilesSeed = allUsers.map((user) => ({
		userId: user.id,
		fullName: user.email.split("@")[0],
	}));

	await db.insert(userProfiles).values(userProfilesSeed);

	const roomTypesSeed = insertedHotels.flatMap((hotel) => {
		const roomTypeConfigs = [
			{ name: "Single", capacity: 1, basePrice: 50, roomBias: 0 },
			{ name: "Standard", capacity: 2, basePrice: 80, roomBias: 1 },
			{ name: "Deluxe", capacity: 3, basePrice: 120, roomBias: 2 },
			{ name: "Suite", capacity: 4, basePrice: 180, roomBias: 3 },
		] as const;

		const typesForHotel = hotel.id % 2 === 0 ? roomTypeConfigs.slice(0, 3) : roomTypeConfigs;

		return typesForHotel.map((typeConfig) => ({
			hotelId: hotel.id,
			name: typeConfig.name,
			capacity: typeConfig.capacity,
			pricePerNight: typeConfig.basePrice + ((hotel.id % 5) * 10), // Add some variation based on hotel
			totalRooms: 3 + ((hotel.id + typeConfig.roomBias) % 8),
		}));
	});

	const insertedRoomTypes = await db
		.insert(roomTypes)
		.values(roomTypesSeed)
		.returning({ id: roomTypes.id, capacity: roomTypes.capacity, totalRooms: roomTypes.totalRooms, hotelId: roomTypes.hotelId });

	const firstRoomTypeByHotel = new Map<number, { id: number; hotelId: number }>();
	for (const roomType of insertedRoomTypes) {
		if (!firstRoomTypeByHotel.has(roomType.hotelId)) {
			firstRoomTypeByHotel.set(roomType.hotelId, roomType);
		}
	}

	const reviewTemplates = [
		{
			rating: 5,
			comment: "Smooth check-in, spotless room, and a team that handled every request quickly.",
			reply: "Thank you for staying with us. We are glad the team made your visit easy.",
		},
		{
			rating: 4,
			comment: "Comfortable bed, reliable Wi-Fi, and a convenient location for a short stay.",
			reply: null,
		},
		{
			rating: 5,
			comment: "The room felt fresh and quiet, and breakfast had enough variety for the whole family.",
			reply: "We appreciate the kind note and hope to welcome your family again.",
		},
		{
			rating: 4,
			comment: "Friendly staff and good value. The lobby was busy at peak hours, but service stayed helpful.",
			reply: null,
		},
		{
			rating: 5,
			comment: "Housekeeping was consistent, the room was quiet, and the front desk gave useful local tips.",
			reply: "We are happy the stay felt easy and comfortable from arrival to departure.",
		},
		{
			rating: 4,
			comment: "Clean room, fair pricing, and a practical location for meetings and dinner nearby.",
			reply: null,
		},
		{
			rating: 5,
			comment: "The staff remembered our requests, and the room layout worked well for a longer stay.",
			reply: "Thank you for the thoughtful feedback. We hope to host you again soon.",
		},
		{
			rating: 4,
			comment: "Good breakfast, comfortable linens, and reliable service throughout the weekend.",
			reply: null,
		},
		{
			rating: 5,
			comment: "A polished stay with fast check-out, strong water pressure, and very helpful concierge support.",
			reply: "We appreciate your review and will share it with the concierge team.",
		},
		{
			rating: 4,
			comment: "The room matched the listing, transport was easy, and staff handled questions professionally.",
			reply: null,
		},
	] as const;

	const reviewBookingSpecs = insertedHotels.flatMap((hotel, hotelIndex) => {
		const roomType = firstRoomTypeByHotel.get(hotel.id);
		if (!roomType) return [];

		const templateCount = hotelIndex < recentHotelCount ? recentHotelReviewCount : establishedHotelReviewCount;
		return reviewTemplates.slice(0, templateCount).map((template, reviewIndex) => {
			const checkIn = addDays(today, -110 - hotelIndex - reviewIndex * 7);
			const checkOut = addDays(checkIn, 2 + (reviewIndex % 3));
			const user = guestUsers[(hotelIndex * establishedHotelReviewCount + reviewIndex) % guestUsers.length];
			const isStripe = reviewIndex % 2 === 0;

			return {
				hotelId: hotel.id,
				ownerId: hotel.ownerId,
				roomTypeId: roomType.id,
				userId: user.id,
				checkInDate: toDateOnly(checkIn),
				checkOutDate: toDateOnly(checkOut),
				guestsCount: 1 + (reviewIndex % 2),
				roomsCount: 1,
				status: "confirmed" as const,
				paymentMethod: isStripe ? "stripe" as const : "cash_on_arrival" as const,
				paymentStatus: isStripe ? "paid" as const : "pending" as const,
				rating: template.rating,
				comment: template.comment,
				partnerReply: template.reply,
			};
		});
	});

	const bookingsSeed = insertedRoomTypes.flatMap((roomType) => {
		const totalBookings = 2 + (roomType.id % 3);

		return Array.from({ length: totalBookings }, (_, index) => {
			const checkInOffset = (roomType.id * 7 + index * 3) % 92;
			const checkIn = new Date("2026-06-01");
			checkIn.setDate(checkIn.getDate() + checkInOffset);

			const nights = 2 + ((roomType.id + index) % 4);
			const checkOut = new Date(checkIn);
			checkOut.setDate(checkOut.getDate() + nights);

			const userId = guestUsers[(roomType.id * 3 + index) % guestUsers.length].id;

			return {
				roomTypeId: roomType.id,
				userId,
				checkInDate: checkIn.toISOString().slice(0, 10),
				checkOutDate: checkOut.toISOString().slice(0, 10),
				guestsCount: 1,
				status: "confirmed" as const,
			};
		});
	});

	const fullyBookedHotelIds = new Set(insertedHotels.slice(0, 5).map((hotel) => hotel.id));
	const fullyBookedRoomTypes = insertedRoomTypes.filter((roomType) => fullyBookedHotelIds.has(roomType.hotelId));

	for (const roomType of fullyBookedRoomTypes) {
		for (let i = 0; i < roomType.totalRooms; i++) {
			bookingsSeed.push({
				roomTypeId: roomType.id,
				userId: guestUsers[i % guestUsers.length].id,
				checkInDate: "2026-06-20",
				checkOutDate: "2026-06-25",
				guestsCount: 1,
				status: "confirmed" as const,
			});
		}
	}

	const peterPastBookings = Array.from({ length: 3 }, (_, index) => {
		const checkIn = addDays(today, -30 - index * 12);
		const checkOut = addDays(checkIn, 3 + (index % 2));
		return {
			roomTypeId: insertedRoomTypes[index % insertedRoomTypes.length].id,
			userId: peterUser.id,
			checkInDate: toDateOnly(checkIn),
			checkOutDate: toDateOnly(checkOut),
			guestsCount: 1 + (index % 2),
			roomsCount: 1,
			status: "confirmed" as const,
			paymentMethod: "cash_on_arrival" as const,
			paymentStatus: "pending" as const,
		};
	});

	const peterFutureBookings = Array.from({ length: 3 }, (_, index) => {
		const checkIn = addDays(today, 14 + index * 10);
		const checkOut = addDays(checkIn, 2 + (index % 3));
		return {
			roomTypeId: insertedRoomTypes[(index + 3) % insertedRoomTypes.length].id,
			userId: peterUser.id,
			checkInDate: toDateOnly(checkIn),
			checkOutDate: toDateOnly(checkOut),
			guestsCount: 1 + (index % 2),
			roomsCount: 1,
			status: "confirmed" as const,
			paymentMethod: "cash_on_arrival" as const,
			paymentStatus: "pending" as const,
		};
	});

	const peterCurrentBooking = {
		roomTypeId: insertedRoomTypes[0].id,
		userId: peterUser.id,
		checkInDate: toDateOnly(addDays(today, -2)),
		checkOutDate: toDateOnly(addDays(today, 7)),
		guestsCount: 2,
		roomsCount: 1,
		status: "confirmed" as const,
		paymentMethod: "cash_on_arrival" as const,
		paymentStatus: "pending" as const,
	};

	bookingsSeed.push(...peterPastBookings, ...peterFutureBookings, peterCurrentBooking);

	const reviewBookingStartIndex = bookingsSeed.length;
	bookingsSeed.push(
		...reviewBookingSpecs.map((spec) => ({
			roomTypeId: spec.roomTypeId,
			userId: spec.userId,
			checkInDate: spec.checkInDate,
			checkOutDate: spec.checkOutDate,
			guestsCount: spec.guestsCount,
			roomsCount: spec.roomsCount,
			status: spec.status,
			paymentMethod: spec.paymentMethod,
			paymentStatus: spec.paymentStatus,
		}))
	);

	const insertedBookings = await db.insert(bookings).values(bookingsSeed).returning({ id: bookings.id });

	const reviewBookings = insertedBookings.slice(
		reviewBookingStartIndex,
		reviewBookingStartIndex + reviewBookingSpecs.length
	);

	const reviewsSeed = reviewBookingSpecs.map((spec, index) => {
		const createdAt = addDays(today, -18 - (index % 35));
		const partnerRepliedAt = spec.partnerReply ? addDays(createdAt, 2 + (index % 3)) : null;

		return {
			userId: spec.userId,
			hotelId: spec.hotelId,
			bookingId: reviewBookings[index].id,
			rating: spec.rating,
			comment: spec.comment,
			moderationStatus: "published" as const,
			partnerReply: spec.partnerReply,
			partnerRepliedAt,
			partnerRepliedBy: spec.partnerReply ? spec.ownerId : null,
			createdAt,
			updatedAt: partnerRepliedAt ?? createdAt,
		};
	});

	const insertedReviews = reviewsSeed.length
		? await db.insert(reviews).values(reviewsSeed).returning({ id: reviews.id })
		: [];

	const hotelImagesSeed = (
		await Promise.all(
			insertedHotels.map(async (hotel) => {
				const rawImages = hotelImagesMap[hotel.name] ?? [];
				const validImages = await getWorkingImages(rawImages);

				const finalImages = validImages.length > 0
					? validImages
					: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"];

				return finalImages.map((url) => ({ hotelId: hotel.id, imageKey: url }));
			})
		)
	).flat();

	const insertedImages = await db
		.insert(hotelImages)
		.values(hotelImagesSeed)
		.returning({ id: hotelImages.id });

	console.log(`Inserted roles: ${insertedRoles.length}`);
	console.log(`Inserted partner users: ${partnerUsers.length}`);
	console.log(`Inserted guest users: ${guestUsers.length}`);
	console.log(`Inserted user profiles: ${userProfilesSeed.length}`);
	console.log(`Inserted hotels: ${insertedHotels.length}`);
	console.log(`Inserted hotel payment methods: ${hotelPaymentMethodsSeed.length}`);
	console.log(`Inserted room types: ${insertedRoomTypes.length}`);
	console.log(`Inserted bookings: ${insertedBookings.length}`);
	console.log(`Inserted reviews: ${insertedReviews.length}`);
	console.log(`Inserted hotel images: ${insertedImages.length}`);
}

seed().catch((error) => {
	console.error("Seed failed", error);
	process.exitCode = 1;
});
