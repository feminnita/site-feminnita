import { createClient } from "@/lib/supabase/client";
import { sortSizes } from "@/lib/variants";

// Formato que todos os componentes da loja esperam
export type StoreProduct = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  pixPrice: number;
  salePrice: number | null;
  installments: number;
  installmentPrice: number;
  images: string[];
  videoUrl: string | null;
  colors: string[];
  sizes: string[];
  category: string;
  category_id: string | null;
  featured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  active: boolean;
  stock: number;
  view_count: number;
};

function mapProduct(p: any, variants: any[]): StoreProduct {
  const pvs = variants.filter((v) => v.product_id === p.id);
  const colors = [...new Set(pvs.map((v: any) => v.color).filter(Boolean))] as string[];
  const sizes  = sortSizes([...new Set(pvs.map((v: any) => v.size).filter(Boolean))] as string[]);
  const price  = p.base_price ?? 0;
  const pixPrice = p.pix_price ?? price * 0.9;
  const installments = price >= 50 ? 6 : 1;

  return {
    id:              p.id,
    code:            p.code ?? "",
    name:            p.name,
    slug:            p.slug,
    description:     p.description ?? "",
    price,
    pixPrice,
    salePrice:       p.sale_price ?? null,
    installments,
    installmentPrice: +(price / installments).toFixed(2),
    images:          Array.isArray(p.images) ? p.images : [],
    videoUrl:        p.video_url ?? null,
    colors:          colors.length ? colors : ["rose"],
    sizes:           sizes.length  ? sizes  : ["P", "M", "G"],
    category:        p.categories?.name ?? "",
    category_id:     p.category_id ?? null,
    featured:        p.featured ?? false,
    isNew:           p.is_new ?? false,
    isBestseller:    p.is_bestseller ?? false,
    active:          p.active ?? true,
    stock:           p.stock ?? 0,
    view_count:      p.view_count ?? 0,
  };
}

// Busca todos os produtos ativos com variantes
export async function fetchProducts(options?: {
  featured?: boolean;
  category_slug?: string;
  limit?: number;
}): Promise<StoreProduct[]> {
  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (options?.featured) query = query.eq("featured", true);
  if (options?.limit)    query = query.limit(options.limit);
  if (options?.category_slug) {
    // filtra via join
    query = query.eq("categories.slug", options.category_slug);
  }

  const { data: products, error } = await query;
  if (error || !products?.length) return [];

  const ids = products.map((p) => p.id);
  const { data: variants } = await supabase
    .from("product_skus")
    .select("product_id, color, size, stock_qty")
    .in("product_id", ids);

  return products.map((p) => mapProduct(p, variants ?? []));
}

// Busca um produto por ID ou slug
export async function fetchProduct(idOrSlug: string): Promise<StoreProduct | null> {
  const supabase = createClient();

  const isUUID = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const field  = isUUID ? "id" : "slug";

  const { data: p } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq(field, idOrSlug)
    .eq("active", true)
    .single();

  if (!p) return null;

  const { data: variants } = await supabase
    .from("product_skus")
    .select("product_id, color, size, stock_qty")
    .eq("product_id", p.id);

  return mapProduct(p, variants ?? []);
}
