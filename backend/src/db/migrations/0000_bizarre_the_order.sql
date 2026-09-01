CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"code" text,
	"category_id" uuid,
	"base_price" numeric(10, 2) NOT NULL,
	"pix_price" numeric(10, 2),
	"sale_price" numeric(10, 2),
	"stock" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"is_new" boolean DEFAULT false,
	"is_bestseller" boolean DEFAULT false,
	"images" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"meta_title" text,
	"meta_description" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"weight_kg" numeric(6, 3) DEFAULT '0.3',
	"pkg_height_cm" numeric(6, 2) DEFAULT '5',
	"pkg_width_cm" numeric(6, 2) DEFAULT '15',
	"pkg_length_cm" numeric(6, 2) DEFAULT '20',
	"colors" text[] DEFAULT '{}',
	"sizes" text[] DEFAULT '{}',
	"size_chart" jsonb DEFAULT '{}'::jsonb,
	"bling_id" bigint,
	"video_url" text,
	"color_images" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"parent_id" uuid,
	"active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;