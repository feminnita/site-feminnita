-- Asaas payment integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_payment_id text;
CREATE INDEX IF NOT EXISTS orders_asaas_payment_idx ON orders(asaas_payment_id);
