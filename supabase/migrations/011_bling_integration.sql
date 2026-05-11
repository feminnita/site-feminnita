-- Bling OAuth tokens
CREATE TABLE IF NOT EXISTS bling_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  updated_at timestamptz DEFAULT now()
);

-- Mapa Bling product ID → Supabase product ID
ALTER TABLE products ADD COLUMN IF NOT EXISTS bling_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS products_bling_id_idx ON products(bling_id) WHERE bling_id IS NOT NULL;

-- Log de sincronizações
CREATE TABLE IF NOT EXISTS bling_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  products_synced int DEFAULT 0,
  products_created int DEFAULT 0,
  products_updated int DEFAULT 0,
  errors int DEFAULT 0,
  status text DEFAULT 'running'
);
