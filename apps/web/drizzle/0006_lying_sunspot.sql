-- Rename existing columns to preserve data
ALTER TABLE "hotel_images" RENAME COLUMN "url" TO "image_key";--> statement-breakpoint
ALTER TABLE "user_profiles" RENAME COLUMN "avatar_url" TO "avatar_key";--> statement-breakpoint

-- Add new fields for hotel_images
ALTER TABLE "hotel_images" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD COLUMN "is_cover" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint