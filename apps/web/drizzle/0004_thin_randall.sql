CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,

	"full_name" text,
	"phone" text,

	"nationality" text,
	"date_of_birth" date,
	"gender" text,
	"passport_number" text,

	"street" text,
	"city" text,
	"country" text,
	"zip" text,

	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_user_id_users_id_fk"
FOREIGN KEY ("user_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;