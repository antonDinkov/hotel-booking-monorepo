CREATE TABLE "favorite_hotels" (
	"user_id" uuid NOT NULL,
	"hotel_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_hotels_user_id_hotel_id_pk" PRIMARY KEY("user_id","hotel_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_hotels" ADD CONSTRAINT "favorite_hotels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_hotels" ADD CONSTRAINT "favorite_hotels_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;