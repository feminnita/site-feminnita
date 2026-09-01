CREATE TABLE "product_color_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"color_id" uuid,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_color_images_product_id_color_id_unique" UNIQUE("product_id","color_id")
);
--> statement-breakpoint
CREATE TABLE "products_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_colors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "products_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"size" text NOT NULL,
	"color_id" uuid,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"reserved_qty" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"sale_price" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_skus_product_id_size_color_id_unique" UNIQUE("product_id","size","color_id")
);
--> statement-breakpoint
ALTER TABLE "product_color_images" ADD CONSTRAINT "product_color_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_color_images" ADD CONSTRAINT "product_color_images_color_id_products_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."products_colors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_skus" ADD CONSTRAINT "products_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_skus" ADD CONSTRAINT "products_skus_color_id_products_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."products_colors"("id") ON DELETE no action ON UPDATE no action;