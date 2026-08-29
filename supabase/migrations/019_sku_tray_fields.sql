-- Cadastro estilo Tray: cada variação (product_skus) editável de forma independente.
-- Campos por variação que a Tray tem e a loja ainda não tinha. Tudo nullable/aditivo (não destrutivo).
-- price / sale_price já existem (migration 018).

ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS reference   text;      -- Referência/SKU da variação (ex 59200CASTANHOP)
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS ean         text;      -- EAN/GTIN/UPC
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS cost_price  numeric;   -- Preço de custo
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS min_stock   int DEFAULT 0;  -- Estoque mínimo
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS sale_start  date;      -- Promoção: início
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS sale_end    date;      -- Promoção: fim
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS active      boolean DEFAULT true;  -- Inativar variação sem apagar
-- Peso/dimensões por variação (herda do produto quando null)
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS weight_kg     numeric(8,3);
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS pkg_height_cm numeric(8,1);
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS pkg_width_cm  numeric(8,1);
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS pkg_length_cm numeric(8,1);

-- Índice para carregar as variações de um produto rápido
CREATE INDEX IF NOT EXISTS idx_product_skus_product ON product_skus(product_id);
