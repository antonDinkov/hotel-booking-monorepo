CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
-- Safe migration: convert integer user_id to uuid by creating placeholder users
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "user_id_new" uuid;--> statement-breakpoint
INSERT INTO "users" (id, email, password_hash, is_active, created_at)
SELECT gen_random_uuid(), ('legacy-user-' || b.user_id || '@local'), gen_random_uuid()::text, true, now()
FROM (SELECT DISTINCT user_id FROM bookings WHERE user_id IS NOT NULL) b
WHERE NOT EXISTS (
	SELECT 1 FROM users u WHERE u.email = ('legacy-user-' || b.user_id || '@local')
);--> statement-breakpoint
UPDATE "bookings" b
SET user_id_new = u.id
FROM "users" u
WHERE u.email = ('legacy-user-' || b.user_id || '@local');--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "user_id_new" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;