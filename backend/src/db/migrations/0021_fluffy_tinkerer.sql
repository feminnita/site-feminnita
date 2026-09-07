CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"cover_url" text,
	"body" text DEFAULT '' NOT NULL,
	"access" text DEFAULT 'publico' NOT NULL,
	"kind" text DEFAULT 'artigo' NOT NULL,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"video_url" text,
	"attachment_url" text,
	"author_name" text,
	"author_customer_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_customer_id_customers_id_fk" FOREIGN KEY ("author_customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_listagem_idx" ON "posts" USING btree ("status","access","kind");