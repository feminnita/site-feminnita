-- Galeria de imagens por cor/estampa.
-- Formato: { "Marinho": ["url1","url2"], "Rosa": ["url3"] }
-- A coluna products.images continua como galeria geral / fallback.
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_images jsonb DEFAULT '{}'::jsonb;
