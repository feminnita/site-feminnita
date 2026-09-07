CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"source" text DEFAULT 'popup' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sale_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sale_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_outlet" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "cnpj" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "resale_term_version" integer;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "resale_term_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "resale_term_accepted_ip" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "resale_term_version" integer;--> statement-breakpoint
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "src_mobile" text;--> statement-breakpoint
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "title" text;--> statement-breakpoint
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "subtitle" text;--> statement-breakpoint
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "text_position" text DEFAULT 'center-center';--> statement-breakpoint
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "focal" text DEFAULT 'center';