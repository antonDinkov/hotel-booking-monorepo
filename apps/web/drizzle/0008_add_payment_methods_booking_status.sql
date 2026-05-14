CREATE TABLE IF NOT EXISTS "hotel_payment_methods" (
  "hotel_id" integer NOT NULL REFERENCES "hotels" ("id") ON DELETE CASCADE,
  "method" text NOT NULL
);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" text;
