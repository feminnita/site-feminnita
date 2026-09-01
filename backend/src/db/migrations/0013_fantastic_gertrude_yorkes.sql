ALTER TABLE "coupons" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_customer_coupon_unique" ON "orders" USING btree ("customer_id","coupon_id");