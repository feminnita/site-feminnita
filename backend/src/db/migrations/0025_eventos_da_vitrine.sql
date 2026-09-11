CREATE TABLE "store_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"type" text NOT NULL,
	"path" text,
	"product_id" uuid,
	"term" text,
	"result_count" integer,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "store_events_tipo_periodo_idx" ON "store_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "store_events_sessao_idx" ON "store_events" USING btree ("session_id");