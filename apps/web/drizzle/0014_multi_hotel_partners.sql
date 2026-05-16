CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"representative_first_name" text NOT NULL,
	"representative_last_name" text NOT NULL,
	"position" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"website" text,
	"company_address" text,
	"vat_number" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partners_verification_status_check" CHECK ("partners"."verification_status" IN ('pending', 'verified', 'rejected', 'suspended'))
);
--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "partners_user_id_unique" ON "partners" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "partners_email_unique" ON "partners" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX "partners_vat_number_unique" ON "partners" USING btree ("vat_number");
--> statement-breakpoint
CREATE INDEX "partners_company_name_idx" ON "partners" USING btree ("company_name");
--> statement-breakpoint
CREATE INDEX "partners_verification_status_idx" ON "partners" USING btree ("verification_status");
--> statement-breakpoint
INSERT INTO "partners" (
	"user_id",
	"company_name",
	"representative_first_name",
	"representative_last_name",
	"position",
	"email",
	"is_verified",
	"verification_status"
)
SELECT DISTINCT
	"h"."owner_id",
	concat(initcap(split_part("u"."email", '@', 1)), ' Hospitality'),
	coalesce(nullif(split_part("up"."full_name", ' ', 1), ''), 'Partner'),
	CASE
		WHEN position(' ' in coalesce("up"."full_name", '')) > 0
			THEN substring("up"."full_name" from position(' ' in "up"."full_name") + 1)
		ELSE 'Representative'
	END,
	'Owner',
	"u"."email",
	true,
	'verified'
FROM "hotels" "h"
INNER JOIN "users" "u" ON "u"."id" = "h"."owner_id"
LEFT JOIN "user_profiles" "up" ON "up"."user_id" = "u"."id"
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "partner_id" uuid;
--> statement-breakpoint
UPDATE "hotels"
SET "partner_id" = "partners"."id"
FROM "partners"
WHERE "partners"."user_id" = "hotels"."owner_id";
--> statement-breakpoint
ALTER TABLE "hotels" ALTER COLUMN "partner_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "hotels" DROP CONSTRAINT "hotels_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "hotels_partner_id_idx" ON "hotels" USING btree ("partner_id");
--> statement-breakpoint
ALTER TABLE "hotels" DROP COLUMN "owner_id";
