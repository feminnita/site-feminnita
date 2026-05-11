-- Melhor Envio fields on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS me_order_id text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipping_service_id int,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_tracking_code_idx ON orders(tracking_code);
