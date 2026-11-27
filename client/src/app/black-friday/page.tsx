"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProductCard } from "../../components/product/ProductCard";
import { PRODUCT_GRID } from "../../components/product/productGrid";
import { fetchProducts } from "../../services/productsService";
import { ehBlackFriday } from "../../lib/blackFriday";
import type { StoreProduct } from "../../types/product/products";

// 27/11 Chris: todos os produtos da Black Friday numa página só. A lista sai da
// etiqueta "Black Friday" da promoção especial (cadastro do produto no painel):
// marcou lá, aparece aqui; a promoção acabou, sai daqui sozinho.
export default function BlackFridayPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchProducts()
      .then((rows) => {
        if (alive) setProducts(rows.filter((p) => p.active !== false && ehBlackFriday(p)));
      })
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-black px-4 py-10 text-center text-white md:py-14">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          <Tag size={14} /> Só até domingo
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">Black Friday</h1>
        <p className="mt-2 text-sm text-white/80 md:text-lg">Todos os produtos da promoção, num lugar só</p>
      </section>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="mb-8 text-gray-600">
              {products.length} {products.length === 1 ? "produto" : "produtos"}
            </p>
            <div className={PRODUCT_GRID}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <p className="text-xl">A Black Friday terminou</p>
            <p className="mt-2 text-sm">Fique de olho nas próximas promoções.</p>
          </div>
        )}
      </div>
    </div>
  );
}
