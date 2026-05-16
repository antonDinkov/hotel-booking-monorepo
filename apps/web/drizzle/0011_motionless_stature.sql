CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"hotel_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"moderation_status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range_check" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5),
	CONSTRAINT "reviews_moderation_status_check" CHECK ("reviews"."moderation_status" IN ('published', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_booking_id_unique" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "reviews_hotel_status_created_idx" ON "reviews" USING btree ("hotel_id","moderation_status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_user_created_idx" ON "reviews" USING btree ("user_id","created_at");