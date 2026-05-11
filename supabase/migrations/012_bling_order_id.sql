ALTER TABLE orders ADD COLUMN IF NOT EXISTS bling_order_id bigint;
CREATE INDEX IF NOT EXISTS orders_bling_order_idx ON orders(bling_order_id) WHERE bling_order_id IS NOT NULL;
