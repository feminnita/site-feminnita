-- Grade de SKUs por produto (tamanho + cor + estoque)
CREATE TABLE IF NOT EXISTS product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text,
  stock_qty int NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reserved_qty int NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, size, color)
);

-- Available stock = stock_qty - reserved_qty (view for convenience)
CREATE OR REPLACE VIEW product_sku_availability AS
SELECT
  id,
  product_id,
  size,
  color,
  stock_qty,
  reserved_qty,
  GREATEST(0, stock_qty - reserved_qty) AS available_qty,
  CASE
    WHEN GREATEST(0, stock_qty - reserved_qty) = 0 THEN 'out_of_stock'
    WHEN GREATEST(0, stock_qty - reserved_qty) <= 3 THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM product_skus;

CREATE INDEX IF NOT EXISTS product_skus_product_id_idx ON product_skus(product_id);

-- RLS: admins only for writes, public for reads
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_skus"
  ON product_skus FOR SELECT USING (true);

CREATE POLICY "Service role can manage product_skus"
  ON product_skus FOR ALL USING (auth.role() = 'service_role');

-- order_items: add sku_id for stock reservation
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS sku_id uuid REFERENCES product_skus(id);
