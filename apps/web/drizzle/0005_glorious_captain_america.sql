ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "avatar_url" text;