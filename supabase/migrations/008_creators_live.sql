-- Creator storefronts
CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  bio text,
  avatar_url text,
  instagram text,
  tiktok text,
  accent_color text DEFAULT '#8C2F39',
  promo_code text,
  commission_pct numeric(5,2) DEFAULT 10,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  note text,
  UNIQUE (creator_id, product_id)
);

CREATE INDEX IF NOT EXISTS creator_products_creator_idx ON creator_products(creator_id);

-- Affiliate tracking: ref cookie → orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ref_creator text;

-- Live commerce
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stream_url text,
  stream_type text DEFAULT 'youtube' CHECK (stream_type IN ('youtube', 'instagram', 'custom')),
  active boolean DEFAULT false,
  is_live boolean DEFAULT false,
  viewer_count int DEFAULT 0,
  like_count int DEFAULT 0,
  chat_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  note text,
  UNIQUE (session_id, product_id)
);

-- A/B testing events
CREATE TABLE IF NOT EXISTS ab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id text NOT NULL,
  variant_id text NOT NULL,
  goal text NOT NULL,
  value numeric,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ab_events_exp_idx ON ab_events(experiment_id, variant_id, goal);
