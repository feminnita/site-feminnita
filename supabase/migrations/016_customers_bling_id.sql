-- Rastreio do contato de origem no Bling (idempotência da importação de clientes)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bling_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS customers_bling_id_idx ON customers(bling_id) WHERE bling_id IS NOT NULL;
