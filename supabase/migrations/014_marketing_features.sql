-- Afiliados / Parceiros
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  code text UNIQUE NOT NULL,
  commission_pct numeric(5,2) NOT NULL DEFAULT 10,
  total_clicks int NOT NULL DEFAULT 0,
  total_orders int NOT NULL DEFAULT 0,
  total_revenue numeric(10,2) NOT NULL DEFAULT 0,
  total_commission numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campanhas de marketing
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  description text,
  discount_pct numeric(5,2),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Produtos por campanha
CREATE TABLE IF NOT EXISTS campaign_products (
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, product_id)
);

-- Contador de visitas em produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count int NOT NULL DEFAULT 0;
