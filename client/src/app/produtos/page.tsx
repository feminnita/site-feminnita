"use client";

import { Suspense } from "react";
import { Search } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProductCard } from "../../components/product/ProductCard";
import { ProductGridSelecton } from "@/src/components/product/ProductCardSelecton";
import { FilterBar } from "@/src/components/catalog/FilterBar";
import { useProductsPage } from "@/src/hooks/product/useProductsPage";
import { PRODUCT_GRID } from "@/src/components/product/productGrid";

function ProdutosContent() {
    const vm = useProductsPage();

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="mb-1 text-3xl font-light">
                        {vm.query ? `Resultados para "${vm.query}"` : "Produtos"}
                    </h1>
                    {!vm.query && (
                        <p className="text-sm text-gray-500">Toda a coleção Feminnita</p>
                    )}
                </div>

                {/* Barra horizontal de filtros (sticky) — grade ocupa 100% da largura */}
                <FilterBar
                    availableSizes={vm.availableSizes}
                    sizes={vm.sizes}
                    onToggleSize={vm.toggleSize}
                    maxPrice={vm.maxPrice}
                    maxPriceLimit={vm.maxPriceLimit}
                    onMaxPriceChange={vm.setMaxPrice}
                    sort={vm.sort}
                    onSortChange={vm.setSort}
                    resultCount={vm.results.length}
                    activeCount={vm.activeCount}
                    onClearAll={vm.clearAll}
                />

                {vm.loading ? (
                    <ProductGridSelecton count={6} />
                ) : vm.results.length === 0 ? (
                    <div className="py-16 text-center">
                        <Search size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="mb-2 text-lg text-gray-400">
                            {vm.query
                                ? `Nenhum resultado para "${vm.query}"`
                                : "Nenhum produto encontrado"}
                        </p>
                        <p className="mb-6 text-sm text-gray-400">
                            Tente uma busca diferente ou remova alguns filtros
                        </p>
                        <button
                            onClick={vm.clearAll}
                            className="rounded-xl bg-[#8C2F39] px-6 py-2.5 text-sm text-white transition-colors hover:bg-[#7a2832]"
                        >
                            Ver todos os produtos
                        </button>
                    </div>
                ) : (
                    <div className={PRODUCT_GRID}>
                        {vm.results.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProdutosPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white">
                    <Header />
                </div>
            }
        >
            <ProdutosContent />
        </Suspense>
    );
}
