ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "rooms_count" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
