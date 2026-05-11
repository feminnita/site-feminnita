-- ============================================================
-- FEMINNITA E-COMMERCE — Schema completo do banco de dados
-- Execute no Supabase SQL Editor
-- ============================================================

-- Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  category_id UUID REFERENCES categories(id),
  base_price DECIMAL(10,2) NOT NULL,
  pix_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes de produto (tamanhos, cores)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Endereços
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Principal',
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
  payment_method TEXT CHECK (payment_method IN ('pix','boleto','credit_card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  product_image TEXT,
  color TEXT,
  size TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slides do carrossel hero (editável pelo admin)
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image','video')),
  src TEXT NOT NULL,
  alt TEXT,
  poster TEXT,
  cta_text TEXT,
  cta_href TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('super_admin','admin','editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(active, order_index);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Público pode LER categorias, produtos ativos, slides ativos e settings
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (active = true);
CREATE POLICY "public_read_products" ON products FOR SELECT USING (active = true);
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "public_read_hero_slides" ON hero_slides FOR SELECT USING (active = true);
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT USING (true);

-- Clientes autenticados podem ver seus próprios dados
CREATE POLICY "customer_own_data" ON customers FOR ALL USING (auth.uid() = auth_id);
CREATE POLICY "customer_own_addresses" ON addresses FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));
CREATE POLICY "customer_own_orders" ON orders FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));

-- ============================================================
-- Dados iniciais — configurações do site
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('store_name', '"Feminnita"'),
  ('store_phone', '"+55 21 99999-9999"'),
  ('store_email', '"contato@feminnita.com.br"'),
  ('store_address', '{"street":"","city":"Nova Friburgo","state":"RJ","cep":""}'),
  ('store_logo', '"feminnita"'),
  ('store_instagram', '"@feminnita"'),
  ('announcement_bar', '"10X SEM JUROS nos cartões de crédito"'),
  ('free_shipping_threshold', '299'),
  ('pix_discount_percentage', '10')
ON CONFLICT (key) DO NOTHING;

-- Slides iniciais
INSERT INTO hero_slides (type, src, alt, cta_text, cta_href, order_index) VALUES
  ('image', 'https://ext.same-assets.com/2738959979/2302845870.webp', 'Coleção Feminnita', 'VER COLEÇÃO', '/produtos', 0),
  ('image', 'https://ext.same-assets.com/2738959979/1774049605.webp', 'Lançamentos', 'COMPRAR AGORA', '/lancamentos', 1),
  ('image', 'https://ext.same-assets.com/2738959979/2302845870.webp', 'Mais Vendidos', 'MAIS VENDIDOS', '/mais-vendidos', 2),
  ('image', 'https://ext.same-assets.com/2738959979/1774049605.webp', 'Outlet', 'OUTLET — ATÉ 50% OFF', '/outlet', 3)
ON CONFLICT DO NOTHING;
