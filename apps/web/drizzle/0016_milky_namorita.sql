CREATE INDEX "bookings_user_check_in_idx" ON "bookings" USING btree ("user_id","check_in_date");--> statement-breakpoint
CREATE INDEX "bookings_room_type_check_in_out_idx" ON "bookings" USING btree ("room_type_id","check_in_date","check_out_date");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_status_created_at_idx" ON "bookings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_created_at_idx" ON "bookings" USING btree ("payment_status","created_at");--> statement-breakpoint
CREATE INDEX "bookings_payment_method_status_idx" ON "bookings" USING btree ("payment_method","payment_status");--> statement-breakpoint
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "bookings_stripe_checkout_session_id_idx" ON "bookings" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "bookings_stripe_payment_intent_id_idx" ON "bookings" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "bookings_stripe_refund_id_idx" ON "bookings" USING btree ("stripe_refund_id");