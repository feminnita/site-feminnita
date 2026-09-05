"use client";

import { Header } from "../layout/Header";
import { ProductCard } from "../product/ProductCard";
import { PRODUCT_GRID } from "../product/productGrid";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";
import { useEffect, useState } from "react";

// Página de listagem por MARCADOR (flag). Mesma casca da listagem de categoria,
// mas a fonte é a flag do produto (is_new / is_bestseller / is_outlet) em vez da
// ligação de categoria — as categorias homônimas foram desativadas.
export function MarkerListing({
  flag,
  title,
}: {
  flag: "is_new" | "is_bestseller" | "is_outlet";
  title: string;
}) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProducts({ flag })
      .then((rows) => {
        if (alive) setProducts(rows);
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [flag]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8C2F39] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-4xl font-light">{title}</h1>
        <p className="mb-8 text-gray-600">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </p>

        {products.length > 0 ? (
          <div className={PRODUCT_GRID}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <p className="text-xl">Nenhum produto disponível no momento</p>
            <p className="mt-2 text-sm">Volte em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
