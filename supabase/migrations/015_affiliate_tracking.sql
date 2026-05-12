-- Adiciona código de afiliado nos pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code text;

-- Índice para facilitar relatórios por afiliado
CREATE INDEX IF NOT EXISTS orders_affiliate_code_idx ON orders(affiliate_code) WHERE affiliate_code IS NOT NULL;
