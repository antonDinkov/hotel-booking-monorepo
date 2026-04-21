import { relations } from "drizzle-orm";
import { boolean, date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const hotels = pgTable("hotels", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	location: text("location").notNull(),
	description: text("description"),
	pricePerNight: integer("price_per_night").notNull(),
	ownerId: integer("owner_id").notNull(),
	isFeatured: boolean("is_featured").notNull().default(false),
});

export const hotelImages = pgTable("hotel_images", {
	id: serial("id").primaryKey(),
	url: text("url").notNull(),
	hotelId: integer("hotel_id")
		.notNull()
		.references(() => hotels.id),
});

export const roomTypes = pgTable("room_types", {
	id: serial("id").primaryKey(),
	hotelId: integer("hotel_id")
		.notNull()
		.references(() => hotels.id),
	name: text("name").notNull(),
	capacity: integer("capacity").notNull(),
	pricePerNight: integer("price_per_night").notNull(),
	totalRooms: integer("total_rooms").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
	id: serial("id").primaryKey(),
	roomTypeId: integer("room_type_id")
		.notNull()
		.references(() => roomTypes.id),
	userId: integer("user_id").notNull(),
	checkInDate: date("check_in_date").notNull(),
	checkOutDate: date("check_out_date").notNull(),
	guestsCount: integer("guests_count").notNull(),
	status: text("status").default("confirmed"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const hotelsRelations = relations(hotels, ({ many }) => ({
	images: many(hotelImages),
	roomTypes: many(roomTypes),
}));

export const hotelImagesRelations = relations(hotelImages, ({ one }) => ({
	hotel: one(hotels, {
		fields: [hotelImages.hotelId],
		references: [hotels.id],
	}),
}));

export const roomTypesRelations = relations(roomTypes, ({ many, one }) => ({
	hotel: one(hotels, {
		fields: [roomTypes.hotelId],
		references: [hotels.id],
	}),
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	roomType: one(roomTypes, {
		fields: [bookings.roomTypeId],
		references: [roomTypes.id],
	}),
}));
