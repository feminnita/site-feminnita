CREATE TYPE "public"."affiliate_status" AS ENUM('pendente', 'aprovada', 'pausada', 'bloqueada');--> statement-breakpoint
CREATE TYPE "public"."cashback_kind" AS ENUM('ganho', 'uso', 'estorno', 'ajuste');--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"instagram" text,
	"code" text NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '10' NOT NULL,
	"status" "affiliate_status" DEFAULT 'pendente' NOT NULL,
	"pix_key" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "affiliates_email_unique" UNIQUE("email"),
	CONSTRAINT "affiliates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cashback_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"kind" "cashback_kind" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text,
	"note" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "affiliate_commission" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cashback_earned" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cashback_used" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cashback_entries" ADD CONSTRAINT "cashback_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_entries" ADD CONSTRAINT "cashback_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliates_codigo_idx" ON "affiliates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "cashback_entries_cliente_idx" ON "cashback_entries" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "affiliate_payouts_afiliada_idx" ON "affiliate_payouts" USING btree ("affiliate_id");