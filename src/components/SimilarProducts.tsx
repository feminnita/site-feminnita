"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  productId: string;
  categoryId?: string | null;
  hasPurchaseData?: boolean; // para alternar título
};

export function SimilarProducts({ productId, categoryId, hasPurchaseData }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Produtos similares");

  useEffect(() => {
    if (!productId) return;

    const params = new URLSearchParams({ id: productId, limit: "6" });
    if (categoryId) params.set("category_id", categoryId);

    fetch(`/api/product/similar?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data ?? []);
        // Se algum produto tiver freq > 0, usa título "quem comprou"
        const hasCoPurchase = data?.some((p: any) => p.freq > 0);
        setTitle(hasCoPurchase ? "Quem comprou também comprou" : "Produtos similares");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId, categoryId]);

  if (loading) {
    return (
      <div className="mt-16">
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-light mb-8">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
