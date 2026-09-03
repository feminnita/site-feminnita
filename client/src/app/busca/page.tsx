"use client";

import { Header } from "../../components/layout/Header";
import { ProductCard } from "../../components/product/ProductCard";
import { PRODUCT_GRID } from "../../components/product/productGrid";
import { fetchProducts } from "../../services/productsService";
import type { StoreProduct } from "../../types/product/products";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function BuscaContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<StoreProduct[]>([]);
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);

    useEffect(() => {
        fetchProducts()
            .then(setAllProducts)
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (query) searchProducts(query);
        else setResults([]);
    }, [query, allProducts]);

    const searchProducts = (searchTerm: string) => {
        const term = searchTerm.toLowerCase();
        setResults(
            allProducts.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.code?.toLowerCase().includes(term) ||
                    p.category.toLowerCase().includes(term),
            ),
        );
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
                <form onSubmit={handleSearch} className="mx-auto mb-12 max-w-2xl">
                    <div className="relative">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 transform text-gray-400"
                            size={24}
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="O que você está procurando?"
                            className="w-full rounded-lg border-2 py-4 pl-14 pr-4 text-lg focus:border-transparent focus:ring-2 focus:ring-black"
                            autoFocus
                        />
                    </div>
                </form>

                {/* Results */}
                {query && (
                    <>
                        <div className="mb-8">
                            <h1 className="mb-2 text-3xl font-light">
                                Resultados para "{query}"
                            </h1>
                            <p className="text-gray-600">
                                {results.length}{" "}
                                {results.length === 1
                                    ? "produto encontrado"
                                    : "produtos encontrados"}
                            </p>
                        </div>

                        {results.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="mb-4 text-xl text-gray-400">
                                    Nenhum produto encontrado para "{query}"
                                </p>
                                <p className="mb-6 text-gray-500">
                                    Tente usar palavras-chave diferentes ou navegue por nossas
                                    categorias
                                </p>
                                <div className="flex justify-center gap-4">
                                    <a
                                        href="/produtos"
                                        className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
                                    >
                                        Ver Todos os Produtos
                                    </a>
                                    <a
                                        href="/"
                                        className="rounded-lg border px-6 py-3 hover:bg-gray-50"
                                    >
                                        Voltar para Home
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className={PRODUCT_GRID}>
                                {results.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!query && (
                    <div className="py-16 text-center text-gray-400">
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
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-white">
                    <Search size={32} className="animate-pulse" />
                </div>
            }
        >
            <BuscaContent />
        </Suspense>
    );
}
