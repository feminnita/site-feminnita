-- min_stock ja existe no banco: quem criou foi o painel, que usa o mesmo banco
-- e tem a propria pasta de migracoes. Sem IF NOT EXISTS esta migracao quebraria
-- na primeira linha e as colunas de origem da visita nunca seriam criadas.

ALTER TABLE "products_skus" ADD COLUMN IF NOT EXISTS "min_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_medium" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_content" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_term" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "landing_page" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "referrer" text;