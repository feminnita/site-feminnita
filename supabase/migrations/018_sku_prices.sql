-- Preço de venda e promoção por VARIAÇÃO (cor × tamanho). Nullable → fallback no preço do produto.
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS sale_price numeric;
