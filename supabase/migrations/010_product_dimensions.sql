-- Peso e dimensões da embalagem para cálculo de frete
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg numeric(8,3) DEFAULT 0.3;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pkg_height_cm numeric(8,1) DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pkg_width_cm numeric(8,1) DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pkg_length_cm numeric(8,1) DEFAULT 20;

-- Cores e tamanhos disponíveis (arrays simples no produto)
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';

-- Tabela de medidas corporais por tamanho (JSON: { "P": { "busto": "84-88", "cintura": "66-70", "quadril": "90-94" }, ... })
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_chart jsonb DEFAULT '{}';
