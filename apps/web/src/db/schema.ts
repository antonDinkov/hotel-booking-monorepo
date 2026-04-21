import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

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

export const hotelsRelations = relations(hotels, ({ many }) => ({
	images: many(hotelImages),
}));

export const hotelImagesRelations = relations(hotelImages, ({ one }) => ({
	hotel: one(hotels, {
		fields: [hotelImages.hotelId],
		references: [hotels.id],
	}),
}));
