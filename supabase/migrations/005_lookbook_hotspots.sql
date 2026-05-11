-- Add hotspot coordinates to lookbook_products
ALTER TABLE lookbook_products
  ADD COLUMN IF NOT EXISTS hotspot_x numeric(5,1), -- percentage 0-100 from left
  ADD COLUMN IF NOT EXISTS hotspot_y numeric(5,1); -- percentage 0-100 from top
