"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const category = categoriesData.find((c) => c.slug === slug);
  const products = productsData.filter((p) => p.category === slug);

  if (!category) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl mb-4">Categoria não encontrada</h1>
          <a href="/" className="text-blue-600 underline">
            Voltar para home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-light mb-4">{category.name}</h1>
        <p className="text-gray-600 mb-8">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-xl">Nenhum produto nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
