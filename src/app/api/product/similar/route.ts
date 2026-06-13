import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sortSizes } from "@/lib/variants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId  = searchParams.get("id");
  const categoryId = searchParams.get("category_id") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "6");

  if (!productId) return NextResponse.json([]);

  const supabase = await createClient();

  // 1. Quem comprou esse produto também comprou estes
  const { data: coOrders } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId)
    .limit(200);

  const orderIds = (coOrders ?? []).map((r: any) => r.order_id);

  let similar: { id: string; freq: number }[] = [];

  if (orderIds.length > 0) {
    const { data: coItems } = await supabase
      .from("order_items")
      .select("product_id")
      .in("order_id", orderIds)
      .neq("product_id", productId);

    // Conta frequência de cada produto co-comprado
    const freq: Record<string, number> = {};
    for (const item of coItems ?? []) {
      freq[item.product_id] = (freq[item.product_id] ?? 0) + 1;
    }

    similar = Object.entries(freq)
      .map(([id, f]) => ({ id, freq: f }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, limit);
  }

  // 2. Fallback: mesma categoria se não tiver dados suficientes
  if (similar.length < limit) {
    const needed = limit - similar.length;
    const excludeIds = [productId, ...similar.map((s) => s.id)];

    let fallbackQuery = supabase
      .from("products")
      .select("id")
      .eq("active", true)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .limit(needed);

    if (categoryId) {
      fallbackQuery = fallbackQuery.eq("category_id", categoryId);
    }

    const { data: fallback } = await fallbackQuery;
    for (const p of fallback ?? []) {
      similar.push({ id: p.id, freq: 0 });
    }
  }

  if (!similar.length) return NextResponse.json([]);

  // 3. Busca dados completos dos produtos similares
  const ids = similar.map((s) => s.id);
  const { data: products } = await supabase
    .from("products")
    .select("*, product_skus(color, size), categories(name, slug)")
    .in("id", ids)
    .eq("active", true);

  if (!products?.length) return NextResponse.json([]);

  // Mapeia para o formato StoreProduct
  const mapped = products.map((p: any) => {
    const variants = p.product_skus ?? [];
    const colors = [...new Set(variants.map((v: any) => v.color).filter(Boolean))];
    const sizes  = sortSizes([...new Set(variants.map((v: any) => v.size).filter(Boolean))] as string[]);
    const price  = p.base_price ?? 0;
    const pixPrice = p.pix_price ?? +(price * 0.9).toFixed(2);
    const freq = similar.find((s) => s.id === p.id)?.freq ?? 0;

    return {
      id: p.id, code: p.code ?? "", name: p.name, slug: p.slug,
      price, pixPrice,
      installments: price >= 50 ? 6 : 1,
      installmentPrice: +(price / (price >= 50 ? 6 : 1)).toFixed(2),
      images: Array.isArray(p.images) ? p.images : [],
      colors: colors.length ? colors : ["rose"],
      sizes:  sizes.length  ? sizes  : ["P","M","G"],
      category: p.categories?.name ?? "",
      category_id: p.category_id ?? null,
      freq, // para debug/sorting
    };
  });

  // Ordena pela frequência de co-compra
  mapped.sort((a, b) => b.freq - a.freq);

  return NextResponse.json(mapped);
}
