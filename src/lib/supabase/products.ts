import { createClient } from "./client";
import { createClient as createServerSupabase } from "./server";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  code: string | null;
  category_id: string | null;
  base_price: number;
  pix_price: number | null;
  sale_price: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  images: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  installments?: number;
  installment_price?: number;
  category?: { id: string; name: string; slug: string } | null;
}

// Server-side fetch (used in Server Components)
export async function getProductsServer(filters?: {
  category?: string;
  featured?: boolean;
  is_new?: boolean;
  limit?: number;
  search?: string;
}) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("active", true)
    .gt("stock", 0);

  if (filters?.category) {
    query = query.eq("categories.slug", filters.category);
  }
  if (filters?.featured) {
    query = query.eq("featured", true);
  }
  if (filters?.is_new) {
    query = query.eq("is_new", true);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) {
    console.error("getProductsServer error:", error.message);
    return [];
  }
  return (data || []) as Product[];
}

export async function getProductBySlugServer(slug: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error) return null;
  return data as Product;
}

export async function getProductsByCategoryServer(categorySlug: string) {
  const supabase = await createServerSupabase();
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("category_id", cat.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Product[];
}

// Helper: adapt Supabase product to vitrine format
export function adaptProduct(p: Product) {
  const images = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : ["https://ext.same-assets.com/2738959979/254087678.webp"];

  const base = p.base_price || 0;
  const pix = p.pix_price ?? Math.round(base * 0.9 * 100) / 100;
  const installments = 10;
  const installmentPrice = Math.round((base / installments) * 100) / 100;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    code: p.code || "",
    category: p.category?.slug || "pijamas",
    price: p.sale_price ?? base,
    pixPrice: pix,
    fullPrice: base,
    installments,
    installmentPrice,
    images,
    sizes: (p.sizes as string[]) || ["P", "M", "G", "GG"],
    colors: (p.colors as { name: string; hex: string }[]) || [],
    inStock: p.stock > 0,
    description: p.description || "",
  };
}
