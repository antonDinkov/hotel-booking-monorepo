ALTER TABLE "hotel_images" ADD COLUMN "room_type_id" integer;--> statement-breakpoint
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hotel_images_hotel_room_idx" ON "hotel_images" USING btree ("hotel_id","room_type_id");--> statement-breakpoint
CREATE INDEX "hotel_images_room_type_id_idx" ON "hotel_images" USING btree ("room_type_id");