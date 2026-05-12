"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { fetchProducts, type StoreProduct } from "@/lib/products";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<{ name: string; description: string | null } | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    async function load() {
      setLoading(true);

      // Busca dados da categoria
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("slug", slug)
        .eq("active", true)
        .single();

      setCategory(cat ?? null);

      if (cat) {
        // Busca produtos desta categoria
        const all = await fetchProducts();
        setProducts(all.filter((p) => p.category_id === cat.id));
      }

      setLoading(false);
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl mb-4">Categoria não encontrada</h1>
          <a href="/" className="text-blue-600 underline">Voltar para home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-light mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-500 mb-2 text-sm">{category.description}</p>
        )}
        <p className="text-gray-600 mb-8">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </p>

        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-xl">Nenhum produto nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
