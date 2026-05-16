import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	primaryKey,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash"),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
    userId: uuid("user_id")
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),

    fullName: text("full_name"),
    phone: text("phone"),

    nationality: text("nationality"),
    dateOfBirth: date("date_of_birth"),
    gender: text("gender"),

    passportNumber: text("passport_number"),

	avatarKey: text("avatar_key"),

    street: text("street"),
    city: text("city"),
    country: text("country"),
    zip: text("zip"),

	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
});

export const userRoles = pgTable(
	"user_roles",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: integer("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey(table.userId, table.roleId),
	})
);

export const partners = pgTable(
	"partners",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyName: text("company_name").notNull(),
		representativeFirstName: text("representative_first_name").notNull(),
		representativeLastName: text("representative_last_name").notNull(),
		position: text("position").notNull(),
		email: text("email").notNull(),
		phone: text("phone"),
		website: text("website"),
		companyAddress: text("company_address"),
		vatNumber: text("vat_number"),
		isVerified: boolean("is_verified").notNull().default(false),
		verificationStatus: text("verification_status").notNull().default("pending"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("partners_user_id_unique").on(table.userId),
		uniqueIndex("partners_email_unique").on(table.email),
		uniqueIndex("partners_vat_number_unique").on(table.vatNumber),
		index("partners_company_name_idx").on(table.companyName),
		index("partners_verification_status_idx").on(table.verificationStatus),
		check("partners_verification_status_check", sql`${table.verificationStatus} IN ('pending', 'verified', 'rejected', 'suspended')`),
	]
);

export const hotels = pgTable(
	"hotels",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull(),
		location: text("location").notNull(),
		description: text("description"),
		partnerId: uuid("partner_id")
			.notNull()
			.references(() => partners.id, { onDelete: "cascade" }),
		isFeatured: boolean("is_featured").notNull().default(false),
		registeredAt: timestamp("registered_at").notNull().defaultNow(),
	},
	(table) => [
		index("hotels_partner_id_idx").on(table.partnerId),
	]
);

export const favoriteHotels = pgTable(
	"favorite_hotels",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		hotelId: integer("hotel_id")
			.notNull()
			.references(() => hotels.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		pk: primaryKey(table.userId, table.hotelId),
	})
);

export const hotelImages = pgTable("hotel_images", {
	id: serial("id").primaryKey(),
	imageKey: text("image_key").notNull(),
	hotelId: integer("hotel_id")
		.notNull()
		.references(() => hotels.id),
	sortOrder: integer("sort_order").notNull().default(0),
	isCover: boolean("is_cover").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const hotelPaymentMethods = pgTable("hotel_payment_methods", {
	hotelId: integer("hotel_id")
		.notNull()
		.references(() => hotels.id, { onDelete: "cascade" }),

	method: text("method").notNull(),
});

export const bookings = pgTable("bookings", {
	id: serial("id").primaryKey(),
	roomTypeId: integer("room_type_id")
		.notNull()
		.references(() => roomTypes.id),
	userId: uuid("user_id").notNull().references(() => users.id),
	checkInDate: date("check_in_date").notNull(),
	checkOutDate: date("check_out_date").notNull(),
	guestsCount: integer("guests_count").notNull(),
	roomsCount: integer("rooms_count").notNull().default(1),
	status: text("status").default("confirmed"),
	paymentMethod: text("payment_method"),
	paymentStatus: text("payment_status"),
	stripeCheckoutSessionId: text("stripe_checkout_session_id"),
	stripePaymentIntentId: text("stripe_payment_intent_id"),
	stripeRefundId: text("stripe_refund_id"),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable(
	"reviews",
	{
		id: serial("id").primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		hotelId: integer("hotel_id")
			.notNull()
			.references(() => hotels.id),
		bookingId: integer("booking_id")
			.notNull()
			.references(() => bookings.id, { onDelete: "cascade" }),
		rating: integer("rating").notNull(),
		comment: text("comment"),
		moderationStatus: text("moderation_status").notNull().default("published"),
		partnerReply: text("partner_reply"),
		partnerRepliedAt: timestamp("partner_replied_at"),
		partnerRepliedBy: uuid("partner_replied_by").references(() => users.id, { onDelete: "set null" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("reviews_booking_id_unique").on(table.bookingId),
		index("reviews_hotel_status_created_idx").on(table.hotelId, table.moderationStatus, table.createdAt),
		index("reviews_user_created_idx").on(table.userId, table.createdAt),
		check("reviews_rating_range_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
		check("reviews_moderation_status_check", sql`${table.moderationStatus} IN ('published', 'hidden')`),
	]
);

export const hotelsRelations = relations(hotels, ({ many, one }) => ({
	images: many(hotelImages),
	roomTypes: many(roomTypes),
	paymentMethods: many(hotelPaymentMethods),
	reviews: many(reviews),
	favoriteHotels: many(favoriteHotels),
	partner: one(partners, {
		fields: [hotels.partnerId],
		references: [partners.id],
	}),
}));

export const favoriteHotelsRelations = relations(favoriteHotels, ({ one }) => ({
	user: one(users, {
		fields: [favoriteHotels.userId],
		references: [users.id],
	}),
	hotel: one(hotels, {
		fields: [favoriteHotels.hotelId],
		references: [hotels.id],
	}),
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

export const hotelPaymentMethodsRelations = relations(hotelPaymentMethods, ({ one }) => ({
	hotel: one(hotels, {
		fields: [hotelPaymentMethods.hotelId],
		references: [hotels.id],
	}),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	roomType: one(roomTypes, {
		fields: [bookings.roomTypeId],
		references: [roomTypes.id],
	}),
	user: one(users, {
		fields: [bookings.userId],
		references: [users.id],
	}),
	review: one(reviews, {
		fields: [bookings.id],
		references: [reviews.bookingId],
	}),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id],
	}),
	hotel: one(hotels, {
		fields: [reviews.hotelId],
		references: [hotels.id],
	}),
	booking: one(bookings, {
		fields: [reviews.bookingId],
		references: [bookings.id],
	}),
	partnerReplyAuthor: one(users, {
		fields: [reviews.partnerRepliedBy],
		references: [users.id],
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id],
	}),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
	userRoles: many(userRoles),
	bookings: many(bookings),
	reviews: many(reviews),
	favoriteHotels: many(favoriteHotels),
	profile: one(userProfiles, {
		fields: [users.id],
		references: [userProfiles.userId],
	}),
	partnerProfile: one(partners, {
		fields: [users.id],
		references: [partners.userId],
	}),
}));

export const partnersRelations = relations(partners, ({ many, one }) => ({
	user: one(users, {
		fields: [partners.userId],
		references: [users.id],
	}),
	hotels: many(hotels),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id],
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id],
	}),
}));
