ALTER TABLE "hotels" DROP COLUMN IF EXISTS "owner_id";

ALTER TABLE "hotels"
ADD COLUMN "owner_id" uuid;

ALTER TABLE "hotels"
ADD CONSTRAINT "hotels_owner_id_users_id_fk"
FOREIGN KEY ("owner_id")
REFERENCES "public"."users"("id")
ON DELETE cascade
ON UPDATE no action;