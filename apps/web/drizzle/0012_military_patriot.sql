ALTER TABLE "hotels" ADD COLUMN "registered_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "partner_reply" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "partner_replied_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "partner_replied_by" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_partner_replied_by_users_id_fk" FOREIGN KEY ("partner_replied_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;