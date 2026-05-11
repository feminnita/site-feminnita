"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Search } from "lucide-react";
import productsData from "@/data/products.json";

function BuscaContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query) {
      searchProducts(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchProducts = (searchTerm: string) => {
    const filtered = productsData.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(query);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você está procurando?"
              className="w-full pl-14 pr-4 py-4 text-lg border-2 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
          </div>
        </form>

        {/* Results */}
        {query && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-light mb-2">
                Resultados para "{query}"
              </h1>
              <p className="text-gray-600">
                {results.length} {results.length === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-400 mb-4">
                  Nenhum produto encontrado para "{query}"
                </p>
                <p className="text-gray-500 mb-6">
                  Tente usar palavras-chave diferentes ou navegue por nossas categorias
                </p>
                <div className="flex gap-4 justify-center">
                  <a href="/produtos" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
                    Ver Todos os Produtos
                  </a>
                  <a href="/" className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                    Voltar para Home
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-16 text-gray-400">
            <Search size={64} className="mx-auto mb-4" />
            <p className="text-xl">Digite algo para buscar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Search size={32} className="animate-pulse" /></div>}>
      <BuscaContent />
    </Suspense>
  );
}
