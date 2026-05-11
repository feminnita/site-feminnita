-- Add photos array to product_reviews
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Storage bucket for review photos (run in Supabase Dashboard > Storage)
-- 1. Create bucket named: product-reviews
-- 2. Set to PUBLIC
-- 3. Add policy: allow authenticated + anon INSERT (for uploads)
-- 4. Add policy: allow public SELECT (for display)
--
-- Or run via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-reviews', 'product-reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload review photos (INSERT)
CREATE POLICY IF NOT EXISTS "Anyone can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-reviews');

-- Allow public read
CREATE POLICY IF NOT EXISTS "Public read review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-reviews');
