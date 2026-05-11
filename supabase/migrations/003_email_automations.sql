-- Email automation support columns

-- orders: track which automation emails have been sent
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS post_purchase_email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reorder_email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_cpf text,
  ADD COLUMN IF NOT EXISTS installments int,
  ADD COLUMN IF NOT EXISTS shipping_method text;

-- customers table for birthday automation
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE NOT NULL,
  phone text,
  birthday date,
  birthday_month int GENERATED ALWAYS AS (EXTRACT(MONTH FROM birthday)::int) STORED,
  birthday_day int GENERATED ALWAYS AS (EXTRACT(DAY FROM birthday)::int) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_birthday_idx ON customers(birthday_month, birthday_day);

-- coupons table for birthday and reorder discounts
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) DEFAULT 0,
  customer_email text,
  expires_at timestamptz,
  single_use boolean DEFAULT true,
  used boolean DEFAULT false,
  used_at timestamptz,
  used_by_order_id uuid REFERENCES orders(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);
CREATE INDEX IF NOT EXISTS coupons_email_idx ON coupons(customer_email);

-- Populate customers from existing orders (backfill)
INSERT INTO customers (name, email)
SELECT DISTINCT ON (customer_email)
  customer_name,
  customer_email
FROM orders
WHERE customer_email IS NOT NULL
ON CONFLICT (email) DO NOTHING;
